/// <reference path="../pb_data/types.d.ts" />

// ── Startup: corrigir regras de coleções que podem ter sido criadas sem segurança ──
try {
    const eventsCol = $app.dao().findCollectionByNameOrId("events")
    const desired = "@request.auth.record.role = 'admin' || @request.auth.record.role = 'rh'"
    if (eventsCol.createRule !== desired) {
        eventsCol.createRule = desired
        $app.dao().saveCollection(eventsCol)
        console.log("[security] events.createRule atualizado para admin/rh")
    }
} catch (_) {}

// ── Hook: impede que usuário não-admin altere o campo role ──────────────────────
$app.onRecordBeforeUpdateRequest().add((e) => {
    if (e.collection.name !== "users") { e.next(); return; }

    const authRole = e.auth ? e.auth.get("role") : null;
    if (authRole === "admin") { e.next(); return; }

    const data = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    if (Object.prototype.hasOwnProperty.call(data, "role")) {
        throw new Error("403: Alteração de role não autorizada");
    }
    e.next();
})

// ── Hook: impede que usuário edite registro de outro usuário ────────────────────
$app.onRecordBeforeUpdateRequest().add((e) => {
    if (e.collection.name !== "users") { e.next(); return; }

    const authRole = e.auth ? e.auth.get("role") : null;
    if (authRole === "admin") { e.next(); return; }

    const authId = e.auth ? e.auth.id : null;
    const recordId = e.record ? e.record.id : null;
    if (authId && recordId && authId !== recordId) {
        throw new Error("403: Edição de perfil de outro usuário não autorizada");
    }
    e.next();
})

// ── Hook: impede votos duplicados em pesquisas ──────────────────────────────────
$app.onRecordBeforeCreateRequest().add((e) => {
    if (e.collection.name !== "poll_votes") { e.next(); return; }

    const userId = e.auth ? e.auth.id : null;
    const data   = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    const pollId = data["poll"];

    if (!userId || !pollId) { e.next(); return; }

    let alreadyVoted = false;
    try {
        $app.dao().findFirstRecordByFilter("poll_votes",
            "poll='" + pollId + "' && user='" + userId + "'"
        );
        alreadyVoted = true;
    } catch (_) {
        // findFirstRecordByFilter throws when no record is found — that's OK
    }

    if (alreadyVoted) {
        throw new Error("400: Você já votou nesta pesquisa");
    }
    e.next();
})

// ── Hook: impede training_completion duplicada ──────────────────────────────────
$app.onRecordBeforeCreateRequest().add((e) => {
    if (e.collection.name !== "training_completions") { e.next(); return; }

    const userId     = e.auth ? e.auth.id : null;
    const data       = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    const trainingId = data["training"];

    if (!userId || !trainingId) { e.next(); return; }

    let alreadyDone = false;
    try {
        $app.dao().findFirstRecordByFilter("training_completions",
            "training='" + trainingId + "' && user='" + userId + "'"
        );
        alreadyDone = true;
    } catch (_) {}

    if (alreadyDone) {
        throw new Error("400: Treinamento já concluído");
    }
    e.next();
})
