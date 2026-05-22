/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
    e.next()

    // ── Grupo 1: Collections principais (feed, espaços) ────────────────────────
    let hasSpaces = false
    try { $app.dao().findCollectionByNameOrId("spaces"); hasSpaces = true } catch (_) {}
    if (!hasSpaces) {
        console.log("[setup] Criando collections principais...")
        try {
            extendUsers()
            const spacesId = createSpaces()
            const postsId  = createPosts(spacesId)
            createReactions(postsId)
            createComments(postsId)
            createAnnouncements(spacesId)
            seedDefaultSpaces()
            console.log("[setup] Collections principais criadas!")
        } catch (err) { console.error("[setup] Erro collections principais:", err) }
    }

    // ── Grupo 2: Collections de chat ───────────────────────────────────────────
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
            console.log("[setup] Collections de chat criadas!")
        } catch (err) { console.error("[setup] Erro collections de chat:", err) }
    }
})

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS PRINCIPAIS
// ═══════════════════════════════════════════════════════════════════════════════

function extendUsers() {
    const users = $app.dao().findCollectionByNameOrId("users")
    const existing = users.schema.fields().map((f) => f.name)
    const extras = [
        { name: "department", type: "text" },
        { name: "role",       type: "select", options: { maxSelect: 1, values: ["admin","user","rh","ti"] } },
        { name: "bio",        type: "text" },
        { name: "phone",      type: "text" },
        { name: "birthday",   type: "date" },
    ]
    extras.forEach((f) => { if (!existing.includes(f.name)) users.schema.addField(new SchemaField(f)) })
    $app.dao().saveCollection(users)
}

function createSpaces() {
    const col = new Collection()
    col.name = "spaces"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    col.updateRule = "@request.auth.record.role = 'admin'"
    col.deleteRule = "@request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name: "name",        type: "text", required: true }))
    col.schema.addField(new SchemaField({ name: "color",       type: "text" }))
    col.schema.addField(new SchemaField({ name: "icon",        type: "text" }))
    col.schema.addField(new SchemaField({ name: "description", type: "text" }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("spaces").id
}

function createPosts(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "posts"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name: "author",      type: "relation", required: true, options: { collectionId: usersId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "content",     type: "text",     required: true }))
    col.schema.addField(new SchemaField({ name: "space",       type: "relation", options: { collectionId: spacesId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "attachments", type: "file",     options: { maxSelect: 5, mimeTypes: ["image/jpeg","image/png","image/gif","image/webp","video/mp4","application/pdf"] } }))
    col.schema.addField(new SchemaField({ name: "pinned",      type: "bool" }))
    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("posts").id
}

function createReactions(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "post_reactions"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = user.id"
    col.deleteRule = "@request.auth.id = user.id"
    col.schema.addField(new SchemaField({ name: "post",  type: "relation", required: true, options: { collectionId: postsId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "user",  type: "relation", required: true, options: { collectionId: usersId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "emoji", type: "text",     required: true }))
    $app.dao().saveCollection(col)
}

function createComments(postsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "post_comments"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name: "post",    type: "relation", required: true, options: { collectionId: postsId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "author",  type: "relation", required: true, options: { collectionId: usersId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "content", type: "text",     required: true }))
    $app.dao().saveCollection(col)
}

function createAnnouncements(spacesId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "announcements"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    col.updateRule = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    col.deleteRule = "@request.auth.record.role = 'admin'"
    col.schema.addField(new SchemaField({ name: "title",    type: "text",     required: true }))
    col.schema.addField(new SchemaField({ name: "content",  type: "text",     required: true }))
    col.schema.addField(new SchemaField({ name: "author",   type: "relation", required: true, options: { collectionId: usersId,  maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "space",    type: "relation", options: { collectionId: spacesId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "pinned",   type: "bool" }))
    col.schema.addField(new SchemaField({ name: "expires",  type: "date" }))
    col.schema.addField(new SchemaField({ name: "priority", type: "select",   options: { maxSelect: 1, values: ["normal","high","urgent"] } }))
    $app.dao().saveCollection(col)
}

function seedDefaultSpaces() {
    const spaces = [
        { name: "Geral",         color: "#1abc9c", icon: "🏠", description: "Canal principal da empresa" },
        { name: "RH",            color: "#e74c3c", icon: "👥", description: "Recursos Humanos — avisos, benefícios e conquistas" },
        { name: "TI",            color: "#3498db", icon: "💻", description: "Tecnologia da Informação" },
        { name: "Comercial",     color: "#f39c12", icon: "📈", description: "Time de vendas — metas e resultados" },
        { name: "Eventos",       color: "#9b59b6", icon: "🎉", description: "Fotos e memórias dos eventos da empresa" },
        { name: "Classificados", color: "#27ae60", icon: "🛍️", description: "Compra e venda entre colaboradores" },
    ]
    spaces.forEach((s) => {
        const r = new Record($app.dao().findCollectionByNameOrId("spaces"))
        r.set("name", s.name); r.set("color", s.color)
        r.set("icon", s.icon); r.set("description", s.description)
        $app.dao().saveRecord(r)
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTIONS DE CHAT
// ═══════════════════════════════════════════════════════════════════════════════

function createChannels() {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    let spacesId = ""
    try { spacesId = $app.dao().findCollectionByNameOrId("spaces").id } catch (_) {}

    const col = new Collection()
    col.name = "channels"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = created_by.id || @request.auth.record.role = 'admin'"
    col.deleteRule = "@request.auth.record.role = 'admin'"

    col.schema.addField(new SchemaField({ name: "name",         type: "text", required: true }))
    col.schema.addField(new SchemaField({ name: "type",         type: "select", required: true, options: { maxSelect: 1, values: ["channel","dm"] } }))
    col.schema.addField(new SchemaField({ name: "description",  type: "text" }))
    col.schema.addField(new SchemaField({ name: "created_by",   type: "relation", options: { collectionId: usersId, maxSelect: 1 } }))
    if (spacesId) {
        col.schema.addField(new SchemaField({ name: "space", type: "relation", options: { collectionId: spacesId, maxSelect: 1 } }))
    }

    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("channels").id
}

function createChannelMembers(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "channel_members"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id = user.id || @request.auth.record.role = 'admin'"

    col.schema.addField(new SchemaField({ name: "channel", type: "relation", required: true, options: { collectionId: channelsId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "user",    type: "relation", required: true, options: { collectionId: usersId,    maxSelect: 1 } }))
    $app.dao().saveCollection(col)
}

function createMessages(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "messages"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = author.id"
    col.deleteRule = "@request.auth.id = author.id || @request.auth.record.role = 'admin'"

    col.schema.addField(new SchemaField({ name: "channel",     type: "relation", required: true, options: { collectionId: channelsId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "author",      type: "relation", required: true, options: { collectionId: usersId,    maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "content",     type: "text" }))
    col.schema.addField(new SchemaField({ name: "attachments", type: "file",     options: { maxSelect: 5 } }))
    $app.dao().saveCollection(col)
}

function createTypingStatus(channelsId) {
    const usersId = $app.dao().findCollectionByNameOrId("users").id
    const col = new Collection()
    col.name = "typing_status"
    col.type = "base"
    col.listRule   = "@request.auth.id != ''"
    col.viewRule   = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id = user.id"
    col.deleteRule = "@request.auth.id = user.id"

    col.schema.addField(new SchemaField({ name: "channel", type: "relation", required: true, options: { collectionId: channelsId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "user",    type: "relation", required: true, options: { collectionId: usersId,    maxSelect: 1 } }))
    $app.dao().saveCollection(col)
}

function seedDefaultChannels() {
    const channelsCol = $app.dao().findCollectionByNameOrId("channels")
    const defaults = [
        { name: "geral",      description: "Canal geral da empresa" },
        { name: "rh",         description: "Recursos Humanos" },
        { name: "ti",         description: "Tecnologia da Informação" },
        { name: "comercial",  description: "Time comercial" },
        { name: "random",     description: "Conversa geral e memes 🎉" },
    ]
    defaults.forEach((c) => {
        const r = new Record(channelsCol)
        r.set("name",        c.name)
        r.set("type",        "channel")
        r.set("description", c.description)
        $app.dao().saveRecord(r)
    })
}
