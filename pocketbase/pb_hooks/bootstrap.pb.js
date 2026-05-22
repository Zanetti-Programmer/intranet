/// <reference path="../pb_data/types.d.ts" />

// Cria todas as collections na primeira vez que o PocketBase inicia
onBootstrap((e) => {
    e.next()

    let alreadySetup = false
    try {
        $app.dao().findCollectionByNameOrId("spaces")
        alreadySetup = true
    } catch (_) {}

    if (alreadySetup) return

    console.log("[setup] Criando collections da intranet...")

    try {
        extendUsers()
        const spacesId = createSpaces()
        const postsId  = createPosts(spacesId)
        createReactions(postsId)
        createComments(postsId)
        createAnnouncements(spacesId)
        seedDefaultSpaces(spacesId)
        console.log("[setup] Collections criadas com sucesso!")
    } catch (err) {
        console.error("[setup] Erro:", err)
    }
})

// ── Estende a collection users com campos extras ──────────────────────────────
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
    extras.forEach((f) => {
        if (!existing.includes(f.name)) {
            users.schema.addField(new SchemaField(f))
        }
    })
    $app.dao().saveCollection(users)
}

// ── Spaces ────────────────────────────────────────────────────────────────────
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

// ── Posts ─────────────────────────────────────────────────────────────────────
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

    col.schema.addField(new SchemaField({ name: "author",  type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "content", type: "text",     required: true }))
    col.schema.addField(new SchemaField({ name: "space",   type: "relation", options: { collectionId: spacesId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "attachments", type: "file", options: { maxSelect: 5, mimeTypes: ["image/jpeg","image/png","image/gif","image/webp","video/mp4","application/pdf"] } }))
    col.schema.addField(new SchemaField({ name: "pinned",  type: "bool" }))

    $app.dao().saveCollection(col)
    return $app.dao().findCollectionByNameOrId("posts").id
}

// ── Post Reactions ─────────────────────────────────────────────────────────────
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

    col.schema.addField(new SchemaField({ name: "post",  type: "relation", required: true, options: { collectionId: postsId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "user",  type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "emoji", type: "text",     required: true }))

    $app.dao().saveCollection(col)
}

// ── Post Comments ──────────────────────────────────────────────────────────────
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

    col.schema.addField(new SchemaField({ name: "post",    type: "relation", required: true, options: { collectionId: postsId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "author",  type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "content", type: "text",     required: true }))

    $app.dao().saveCollection(col)
}

// ── Announcements ──────────────────────────────────────────────────────────────
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
    col.schema.addField(new SchemaField({ name: "author",   type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "space",    type: "relation", options: { collectionId: spacesId, maxSelect: 1 } }))
    col.schema.addField(new SchemaField({ name: "pinned",   type: "bool" }))
    col.schema.addField(new SchemaField({ name: "expires",  type: "date" }))
    col.schema.addField(new SchemaField({ name: "priority", type: "select", options: { maxSelect: 1, values: ["normal","high","urgent"] } }))

    $app.dao().saveCollection(col)
}

// ── Seed: Spaces padrão ───────────────────────────────────────────────────────
function seedDefaultSpaces(spacesId) {
    const defaults = [
        { name: "Geral",         color: "#1abc9c", icon: "🏠", description: "Canal principal da empresa" },
        { name: "RH",            color: "#e74c3c", icon: "👥", description: "Recursos Humanos — avisos, benefícios e conquistas" },
        { name: "TI",            color: "#3498db", icon: "💻", description: "Tecnologia da Informação" },
        { name: "Comercial",     color: "#f39c12", icon: "📈", description: "Time de vendas — metas e resultados" },
        { name: "Eventos",       color: "#9b59b6", icon: "🎉", description: "Fotos e memórias dos eventos da empresa" },
        { name: "Classificados", color: "#27ae60", icon: "🛍️", description: "Compra e venda entre colaboradores" },
    ]

    defaults.forEach((s) => {
        const record = new Record($app.dao().findCollectionByNameOrId("spaces"))
        record.set("name",        s.name)
        record.set("color",       s.color)
        record.set("icon",        s.icon)
        record.set("description", s.description)
        $app.dao().saveRecord(record)
    })
}
