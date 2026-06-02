/// <reference path="../pb_data/types.d.ts" />

// onBeforeServe fires after the DAO is initialized, before the HTTP server starts.
// Top-level code runs before the DAO is ready, so ALL setup must live inside this hook.
// NOTE: ServeEvent does not expose e.next() in PocketBase v0.22 JSVM — omit it.
$app.onBeforeServe().add(function(_e) {

// ── Patches de segurança + extensão de users (ONE save only) ─────────────────
patchUsersCollection()

// Patch: corrige regras que usavam sintaxe auth.record.role (inválida em v0.22)
patchAuthRoleRules()

try {
    const ticketsCol = $app.dao().findCollectionByNameOrId("tickets")
    const desiredRule = "@request.auth.role = 'admin' || @request.auth.role = 'ti'"
    if (ticketsCol.updateRule !== desiredRule) {
        ticketsCol.updateRule = desiredRule
        $app.dao().saveCollection(ticketsCol)
        console.log("[security] tickets.updateRule atualizado")
    }
} catch (_) {}

// ── Grupo 1: Feed + Espaços ────────────────────────────────────────────────────
    let hasSpaces = false
    try { $app.dao().findCollectionByNameOrId("spaces"); hasSpaces = true } catch (_) {}
    if (!hasSpaces) {
        console.log("[setup] Criando collections do feed...")
        try {
            const spacesId = createSpaces()
            const postsId  = createPosts(spacesId)
            createReactions(postsId)
            createComments(postsId)
            createStars(postsId)
            createAnnouncements(spacesId)
            seedDefaultSpaces()
        } catch (err) { console.error("[setup] Erro feed:", err) }
    }

    // ── Grupo 2: Chat ──────────────────────────────────────────────────────────
    let hasChannels = false
    try { $app.dao().findCollectionByNameOrId("channels"); hasChannels = true } catch (_) {}
    if (!hasChannels) {
        console.log("[setup] Criando collections de chat...")
        try {
            const channelsId = createChannels()
            createChannelMembers(channelsId)
            createMessages(channelsId)
            createTypingStatus(channelsId)
            seedDefaultChannels()
        } catch (err) { console.error("[setup] Erro chat:", err) }
    }

    // ── Grupo 3: Ferramentas (calendário, chamados, conquistas) ────────────────
    let hasEvents = false
    try { $app.dao().findCollectionByNameOrId("events"); hasEvents = true } catch (_) {}
    if (!hasEvents) {
        console.log("[setup] Criando collections de ferramentas...")
        try {
            let spacesId = ""
            try { spacesId = $app.dao().findCollectionByNameOrId("spaces").id } catch (_) {}
            createEvents(spacesId)
            const ticketsId = createTickets()
            createTicketComments(ticketsId)
            createAchievements()
            createNotifications()
            createDepartments()
        } catch (err) { console.error("[setup] Erro ferramentas:", err) }
    }

    // ── Grupo 4: Mídia (galeria, marketplace) ─────────────────────────────────
    let hasAlbums = false
    try { $app.dao().findCollectionByNameOrId("gallery_albums"); hasAlbums = true } catch (_) {}
    if (!hasAlbums) {
        console.log("[setup] Criando collections de mídia...")
        try {
            let spacesId = ""
            try { spacesId = $app.dao().findCollectionByNameOrId("spaces").id } catch (_) {}
            const albumsId = createGalleryAlbums(spacesId)
            createGalleryPhotos(albumsId)
            createMarketplaceItems()
        } catch (err) { console.error("[setup] Erro mídia:", err) }
    }

    // ── Grupo 5: Módulos (docs, wiki, vagas, benefícios, pesquisas, tarefas, etc.) ──
    let hasDocuments = false
    try { $app.dao().findCollectionByNameOrId("documents"); hasDocuments = true } catch (_) {}
    if (!hasDocuments) {
        console.log("[setup] Criando collections de módulos...")
        try {
            setupDocuments()
            setupWikiArticles()
            setupArticles()
            setupJobPostings()
            setupJobApplications()
            setupBenefits()
            setupPolls()
            setupPollVotes()
            setupTasks()
            setupTrainings()
            setupTrainingCompletions()
            setupUsefulLinks()
            setupWallCards()
        } catch (err) { console.error("[setup] Erro módulos:", err) }
    }

});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH HELPERS (run every startup)
// ═══════════════════════════════════════════════════════════════════════════════

// Combines security rule fix + field extension into ONE saveCollection call
// to avoid UNIQUE constraint collision on _migrations.file when called multiple times.
function patchUsersCollection() {
    try {
        const users = $app.dao().findCollectionByNameOrId("users")
        const existing = users.schema.fields().map((f) => f.name)
        const extras = [
            { name: "department", type: "text" },
            { name: "role",  type: "select", options: { maxSelect: 1, values: ["admin","user","rh","ti"] } },
            { name: "bio",   type: "text" },
            { name: "phone", type: "text" },
            { name: "birthday", type: "date" },
        ]
        let changed = false
        extras.forEach(function(f) { if (!existing.includes(f.name)) { users.schema.addField(new SchemaField(f)); changed = true } })
        const desiredRule = "@request.auth.id = id"
        if (users.updateRule !== desiredRule) { users.updateRule = desiredRule; changed = true }
        // Allow authenticated users to see all colleagues (needed for organogram, people page, etc.)
        const desiredListRule = "@request.auth.id != ''"
        if (users.listRule !== desiredListRule) { users.listRule = desiredListRule; changed = true }
        if (users.viewRule !== desiredListRule) { users.viewRule = desiredListRule; changed = true }
        if (changed) {
            $app.dao().saveCollection(users)
            console.log("[security] users patched (fields/rule)")
        }
    } catch (err) { console.error("[security] Erro ao corrigir users:", err) }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 1 — FEED
// ═══════════════════════════════════════════════════════════════════════════════
function createSpaces() {
    const col = new Collection()
    col.name = "spaces"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = "@request.auth.role = 'admin'"; col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"name", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"color", type:"text" }))
    col.schema.addField(new SchemaField({ name:"icon", type:"text" }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("spaces").id
}
function createPosts(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "posts"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"attachments", type:"file", options:{maxSelect:5,maxSize:10485760} }))
    col.schema.addField(new SchemaField({ name:"pinned", type:"bool" }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("posts").id
}
function createReactions(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "post_reactions"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = user.id"; col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"post", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"emoji", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createStars(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "post_stars"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id = user.id"
    col.schema.addField(new SchemaField({ name:"post", type:"relation", required:true, options:{collectionId:postsId,maxSelect:1,cascadeDelete:true} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createComments(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "post_comments"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"post", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createAnnouncements(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "announcements"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"pinned", type:"bool" }))
    col.schema.addField(new SchemaField({ name:"expires", type:"date" }))
    col.schema.addField(new SchemaField({ name:"priority", type:"select", options:{maxSelect:1,values:["normal","high","urgent"]} }))
    $app.dao().saveCollection(col)
}
function seedDefaultSpaces() {
    const col = $app.dao().findCollectionByNameOrId("spaces")
    const list = [
        { name:"Geral", color:"#1abc9c", icon:"🏠", description:"Canal principal da empresa" },
        { name:"RH", color:"#e74c3c", icon:"👥", description:"Recursos Humanos" },
        { name:"TI", color:"#3498db", icon:"💻", description:"Tecnologia da Informação" },
        { name:"Comercial", color:"#f39c12", icon:"📈", description:"Time de vendas" },
        { name:"Eventos", color:"#9b59b6", icon:"🎉", description:"Fotos e memórias" },
        { name:"Classificados", color:"#27ae60", icon:"🛍️", description:"Compra e venda" },
    ]
    list.forEach((s) => {
        const r = new Record(col)
        r.set("name",s.name); r.set("color",s.color); r.set("icon",s.icon); r.set("description",s.description)
        $app.dao().saveRecord(r)
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 2 — CHAT
// ═══════════════════════════════════════════════════════════════════════════════
function createChannels() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    let spacesId = ""; try { spacesId = $app.dao().findCollectionByNameOrId("spaces").id } catch (_) {}
    const col = new Collection(); col.name = "channels"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = created_by.id || @request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"name", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"type", type:"select", required:true, options:{maxSelect:1,values:["channel","dm"]} }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"created_by", type:"relation", options:{collectionId:usersId,maxSelect:1} }))
    if (spacesId) col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("channels").id
}
function createChannelMembers(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "channel_members"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id = user.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"channel", type:"relation", required:true, options:{collectionId:channelsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createMessages(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "messages"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"channel", type:"relation", required:true, options:{collectionId:channelsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text" }))
    col.schema.addField(new SchemaField({ name:"attachments", type:"file", options:{maxSelect:5,maxSize:20971520} }))
    $app.dao().saveCollection(col)
}
function createTypingStatus(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "typing_status"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = user.id"; col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"channel", type:"relation", required:true, options:{collectionId:channelsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function seedDefaultChannels() {
    const col = $app.dao().findCollectionByNameOrId("channels")
    const list = [
        { name:"geral", description:"Canal geral da empresa" },
        { name:"rh", description:"Recursos Humanos" },
        { name:"ti", description:"Tecnologia da Informação" },
        { name:"comercial", description:"Time comercial" },
        { name:"random", description:"Conversa geral e memes 🎉" },
    ]
    list.forEach((c) => {
        const r = new Record(col); r.set("name",c.name); r.set("type","channel"); r.set("description",c.description)
        $app.dao().saveRecord(r)
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 3 — FERRAMENTAS
// ═══════════════════════════════════════════════════════════════════════════════
function createDepartments() {
    const col = new Collection(); col.name = "departments"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin'"
    col.updateRule = "@request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"name",        type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"color",       type:"text" }))
    $app.dao().saveCollection(col)
}
function createEvents(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "events"; col.type = "base"
    col.listRule = '@request.auth.id != "" && (visibility = "publico" || visibility = "" || @request.auth.id = author || (visibility = "convidados" && attendees ?= @request.auth.id))'
    col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"start", type:"date", required:true }))
    col.schema.addField(new SchemaField({ name:"end", type:"date" }))
    col.schema.addField(new SchemaField({ name:"all_day", type:"bool" }))
    col.schema.addField(new SchemaField({ name:"color", type:"text" }))
    col.schema.addField(new SchemaField({ name:"visibility", type:"select", options:{maxSelect:1,values:["publico","privado","convidados"]} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"attendees", type:"relation", options:{collectionId:usersId,maxSelect:null,cascadeDelete:false} }))
    if (spacesId) col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createTickets() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "tickets"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    // Autor pode ver mas somente admin/ti alteram status — sem author na updateRule
    col.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'ti'"
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"assignee", type:"relation", options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", required:true, options:{maxSelect:1,values:["aberto","em_andamento","resolvido","fechado"]} }))
    col.schema.addField(new SchemaField({ name:"category", type:"select", required:true, options:{maxSelect:1,values:["hardware","software","rede","acesso","outro"]} }))
    col.schema.addField(new SchemaField({ name:"priority", type:"select", required:true, options:{maxSelect:1,values:["baixa","media","alta","urgente"]} }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("tickets").id
}
function createTicketComments(ticketsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "ticket_comments"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"ticket", type:"relation", required:true, options:{collectionId:ticketsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createAchievements() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "achievements"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = col.createRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"recipient", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"icon", type:"text" }))
    col.schema.addField(new SchemaField({ name:"date", type:"date" }))
    col.schema.addField(new SchemaField({ name:"public", type:"bool" }))
    $app.dao().saveCollection(col)
}
function createNotifications() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "notifications"; col.type = "base"
    col.listRule = "@request.auth.id = user.id"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = user.id"; col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"type", type:"text" }))
    col.schema.addField(new SchemaField({ name:"content", type:"text" }))
    col.schema.addField(new SchemaField({ name:"read", type:"bool" }))
    col.schema.addField(new SchemaField({ name:"link", type:"text" }))
    $app.dao().saveCollection(col)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 4 — MÍDIA
// ═══════════════════════════════════════════════════════════════════════════════
function createGalleryAlbums(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "gallery_albums"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"name", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"event_name", type:"text" }))
    col.schema.addField(new SchemaField({ name:"cover", type:"file", options:{maxSelect:1,maxSize:10485760} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    if (spacesId) col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("gallery_albums").id
}
function createGalleryPhotos(albumsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "gallery_photos"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"album", type:"relation", required:true, options:{collectionId:albumsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"file", type:"file", required:true, options:{maxSelect:1,maxSize:10485760,mimeTypes:["image/jpeg","image/png","image/gif","image/webp"]} }))
    col.schema.addField(new SchemaField({ name:"caption", type:"text" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createMarketplaceItems() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "marketplace_items"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"price", type:"number" }))
    col.schema.addField(new SchemaField({ name:"photos", type:"file", options:{maxSelect:5,maxSize:10485760,mimeTypes:["image/jpeg","image/png","image/webp"]} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["disponivel","reservado","vendido"]} }))
    col.schema.addField(new SchemaField({ name:"condition", type:"select", options:{maxSelect:1,values:["novo","usado"]} }))
    col.schema.addField(new SchemaField({ name:"category", type:"text" }))
    col.schema.addField(new SchemaField({ name:"contact_dm", type:"bool" }))
    $app.dao().saveCollection(col)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 5 — MÓDULOS
// ═══════════════════════════════════════════════════════════════════════════════
function setupDocuments() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "documents"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"file", type:"file", required:true, options:{maxSelect:1,maxSize:20971520} }))
    col.schema.addField(new SchemaField({ name:"category", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupWikiArticles() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "wiki_articles"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"category", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"tags", type:"text" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupArticles() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "articles"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"cover", type:"file", options:{maxSelect:1,maxSize:10485760} }))
    col.schema.addField(new SchemaField({ name:"type", type:"select", required:true, options:{maxSelect:1,values:["news","blog"]} }))
    col.schema.addField(new SchemaField({ name:"tags", type:"text" }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["published","draft"]} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupJobPostings() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "job_postings"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = col.createRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"department", type:"text" }))
    col.schema.addField(new SchemaField({ name:"description", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"requirements", type:"text" }))
    col.schema.addField(new SchemaField({ name:"type", type:"select", required:true, options:{maxSelect:1,values:["CLT","PJ","Estágio","Temporário"]} }))
    col.schema.addField(new SchemaField({ name:"deadline", type:"date" }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["aberta","encerrada"]} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupJobApplications() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    let jobsId = ""; try { jobsId = $app.dao().findCollectionByNameOrId("job_postings").id } catch (_) {}
    const col = new Collection(); col.name = "job_applications"; col.type = "base"
    col.listRule = "@request.auth.id = user.id || @request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.viewRule = col.listRule
    col.createRule = "@request.auth.id = @request.data.user"
    col.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.deleteRule = "@request.auth.id = user.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"job", type:"relation", required:true, options:{collectionId:jobsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"message", type:"text" }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["inscrito","em_analise","aprovado","reprovado"]} }))
    $app.dao().saveCollection(col)
}
function setupBenefits() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "benefits"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = col.createRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"details", type:"text" }))
    col.schema.addField(new SchemaField({ name:"category", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"icon", type:"text" }))
    col.schema.addField(new SchemaField({ name:"link", type:"text" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupPolls() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "polls"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"question", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"options", type:"json", required:true, options:{ maxSize: 65536 } }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"deadline", type:"date" }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["ativa","encerrada"]} }))
    $app.dao().saveCollection(col)
}
function setupPollVotes() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    let pollsId = ""; try { pollsId = $app.dao().findCollectionByNameOrId("polls").id } catch (_) {}
    const col = new Collection(); col.name = "poll_votes"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    // Apenas o próprio usuário pode criar seu voto; update/delete bloqueados (imutável)
    col.createRule = "@request.auth.id = @request.data.user"
    // updateRule e deleteRule ficam null (somente superadmin via dashboard)
    col.schema.addField(new SchemaField({ name:"poll", type:"relation", required:true, options:{collectionId:pollsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"option_idx", type:"number", required:false }))
    $app.dao().saveCollection(col)
}
function setupTasks() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "tasks"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = created_by.id || @request.auth.id = assignee.id || @request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.id = created_by.id || @request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"assignee", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"created_by", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"due_date", type:"date" }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["pendente","em_andamento","concluida"]} }))
    col.schema.addField(new SchemaField({ name:"priority", type:"select", options:{maxSelect:1,values:["baixa","media","alta"]} }))
    col.schema.addField(new SchemaField({ name:"is_team", type:"bool" }))
    $app.dao().saveCollection(col)
}
function setupTrainings() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "trainings"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = col.createRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"video_url", type:"text" }))
    col.schema.addField(new SchemaField({ name:"duration", type:"text" }))
    col.schema.addField(new SchemaField({ name:"category", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupTrainingCompletions() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    let trainingsId = ""; try { trainingsId = $app.dao().findCollectionByNameOrId("trainings").id } catch (_) {}
    const col = new Collection(); col.name = "training_completions"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    // Somente o próprio usuário pode registrar sua conclusão
    col.createRule = "@request.auth.id = @request.data.user"
    // updateRule null = imutável; deleteRule apenas admin pode remover
    col.deleteRule = "@request.auth.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"training", type:"relation", required:true, options:{collectionId:trainingsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupUsefulLinks() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "useful_links"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = col.createRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"url", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"category", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"icon", type:"text" }))
    col.schema.addField(new SchemaField({ name:"order", type:"number" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function setupWallCards() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "wall_cards"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"message", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"type", type:"select", required:true, options:{maxSelect:1,values:["parabens","boas_vindas","conquista","despedida","recado"]} }))
    col.schema.addField(new SchemaField({ name:"recipient", type:"relation", options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"emoji", type:"text" }))
    $app.dao().saveCollection(col)
}

// Patches all collections that still use the old auth.record.role syntax
// (invalid in PocketBase v0.22 — correct syntax is auth.role)
function patchAuthRoleRules() {
    try {
        const collections = $app.dao().findCollectionsByType("base")
        const ruleKeys = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"]
        const OLD = "auth.record.role"
        const NEW = "auth.role"
        collections.forEach(function(col) {
            let changed = false
            ruleKeys.forEach(function(key) {
                const val = col[key] || ""
                if (val.indexOf(OLD) !== -1) {
                    col[key] = val.split(OLD).join(NEW)
                    changed = true
                }
            })
            if (changed) {
                $app.dao().saveCollection(col)
                console.log("[patch] " + col.name + ": auth.record.role → auth.role")
            }
        })
    } catch (err) { console.error("[patch] patchAuthRoleRules:", err) }
}
