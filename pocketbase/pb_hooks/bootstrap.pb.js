/// <reference path="../pb_data/types.d.ts" />
// Em PocketBase v0.22 o código no nível raiz executa automaticamente após o bootstrap

// ── Grupo 1: Feed + Espaços ────────────────────────────────────────────────
    let hasSpaces = false
    try { $app.dao().findCollectionByNameOrId("spaces"); hasSpaces = true } catch (_) {}
    if (!hasSpaces) {
        console.log("[setup] Criando collections do feed...")
        try {
            extendUsers()
            const spacesId = createSpaces()
            const postsId  = createPosts(spacesId)
            createReactions(postsId)
            createComments(postsId)
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

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 1 — FEED
// ═══════════════════════════════════════════════════════════════════════════════
function extendUsers() {
    const users = $app.dao().findCollectionByNameOrId("users")
    const existing = users.schema.fields().map((f) => f.name)
    const extras = [
        { name: "department", type: "text" },
        { name: "role",  type: "select", options: { maxSelect: 1, values: ["admin","user","rh","ti"] } },
        { name: "bio",   type: "text" },
        { name: "phone", type: "text" },
        { name: "birthday", type: "date" },
    ]
    extras.forEach((f) => { if (!existing.includes(f.name)) users.schema.addField(new SchemaField(f)) })
    $app.dao().saveCollection(users)
}
function createSpaces() {
    const col = new Collection()
    col.name = "spaces"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    col.updateRule = "@request.auth.record.role = 'admin'"; col.deleteRule = col.updateRule
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
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"attachments", type:"file", options:{maxSelect:5} }))
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
    col.schema.addField(new SchemaField({ name:"post", type:"relation", required:true, options:{collectionId:postsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"user", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"emoji", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createComments(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "post_comments"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"post", type:"relation", required:true, options:{collectionId:postsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createAnnouncements(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "announcements"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    col.updateRule = col.createRule; col.deleteRule = "@request.auth.record.role = 'admin'"
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
    col.updateRule = "@request.auth.id = created_by.id || @request.auth.record.role = 'admin'"
    col.deleteRule = "@request.auth.record.role = 'admin'"
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
    col.deleteRule = "@request.auth.id = user.id || @request.auth.record.role = 'admin'"
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
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"channel", type:"relation", required:true, options:{collectionId:channelsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text" }))
    col.schema.addField(new SchemaField({ name:"attachments", type:"file", options:{maxSelect:5} }))
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
function createEvents(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "events"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"start", type:"date", required:true }))
    col.schema.addField(new SchemaField({ name:"end", type:"date" }))
    col.schema.addField(new SchemaField({ name:"all_day", type:"bool" }))
    col.schema.addField(new SchemaField({ name:"color", type:"text" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    if (spacesId) col.schema.addField(new SchemaField({ name:"space", type:"relation", options:{collectionId:spacesId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createTickets() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "tickets"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin' || @request.auth.record.role = 'ti'"
    col.deleteRule = "@request.auth.record.role = 'admin'"
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
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name:"ticket", type:"relation", required:true, options:{collectionId:ticketsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"content", type:"text", required:true }))
    $app.dao().saveCollection(col)
}
function createAchievements() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "achievements"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
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
    col.updateRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"name", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"event_name", type:"text" }))
    col.schema.addField(new SchemaField({ name:"cover", type:"file", options:{maxSelect:1} }))
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
    col.updateRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"album", type:"relation", required:true, options:{collectionId:albumsId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"file", type:"file", required:true, options:{maxSelect:1,mimeTypes:["image/jpeg","image/png","image/gif","image/webp"]} }))
    col.schema.addField(new SchemaField({ name:"caption", type:"text" }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    $app.dao().saveCollection(col)
}
function createMarketplaceItems() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection(); col.name = "marketplace_items"; col.type = "base"
    col.listRule = "@request.auth.id != ''"; col.viewRule = col.listRule
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.deleteRule = col.updateRule
    col.schema.addField(new SchemaField({ name:"title", type:"text", required:true }))
    col.schema.addField(new SchemaField({ name:"description", type:"text" }))
    col.schema.addField(new SchemaField({ name:"price", type:"number" }))
    col.schema.addField(new SchemaField({ name:"photos", type:"file", options:{maxSelect:5,mimeTypes:["image/jpeg","image/png","image/webp"]} }))
    col.schema.addField(new SchemaField({ name:"author", type:"relation", required:true, options:{collectionId:usersId,maxSelect:1} }))
    col.schema.addField(new SchemaField({ name:"status", type:"select", options:{maxSelect:1,values:["disponivel","reservado","vendido"]} }))
    col.schema.addField(new SchemaField({ name:"category", type:"text" }))
    col.schema.addField(new SchemaField({ name:"contact_dm", type:"bool" }))
    $app.dao().saveCollection(col)
}
