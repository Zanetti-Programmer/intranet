/// <reference path="../pb_data/types.d.ts" />

// ── Startup: corrigir regras de coleções que podem ter sido criadas sem segurança ──
// NOTE: top-level code runs before DAO is ready; wrap in onBeforeServe
$app.onBeforeServe().add(function(_e) {
    try {
        const eventsCol = $app.dao().findCollectionByNameOrId("events")
        const desired = "@request.auth.role = 'admin' || @request.auth.role = 'rh'"
        if (eventsCol.createRule !== desired) {
            eventsCol.createRule = desired
            $app.dao().saveCollection(eventsCol)
            console.log("[security] events.createRule atualizado para admin/rh")
        }
    } catch (_) {}
})

// NOTE: In PocketBase v0.22 JSVM, Handler<T> = (e: T) => void — no e.next().
// Handlers auto-proceed after returning; throw to block.

// ── Hook: impede que usuário não-admin altere o campo role ──────────────────────
$app.onRecordBeforeUpdateRequest().add(function(e) {
    if (e.collection.name !== "users") return;

    const authRole = e.auth ? e.auth.get("role") : null;
    if (authRole === "admin") return;

    const data = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    if (Object.prototype.hasOwnProperty.call(data, "role")) {
        throw new BadRequestError("Alteração de role não autorizada");
    }
})

// ── Hook: impede que usuário edite registro de outro usuário ────────────────────
$app.onRecordBeforeUpdateRequest().add(function(e) {
    if (e.collection.name !== "users") return;

    const authRole = e.auth ? e.auth.get("role") : null;
    if (authRole === "admin") return;

    const authId = e.auth ? e.auth.id : null;
    const recordId = e.record ? e.record.id : null;
    if (authId && recordId && authId !== recordId) {
        throw new ForbiddenError("Edição de perfil de outro usuário não autorizada");
    }
})

// ── Hook: impede votos duplicados em pesquisas ──────────────────────────────────
$app.onRecordBeforeCreateRequest().add(function(e) {
    if (e.collection.name !== "poll_votes") return;

    const userId = e.auth ? e.auth.id : null;
    const data   = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    const pollId = data["poll"];

    if (!userId || !pollId) return;

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
        throw new BadRequestError("Você já votou nesta pesquisa");
    }
})

// ── Hook: impede training_completion duplicada ──────────────────────────────────
$app.onRecordBeforeCreateRequest().add(function(e) {
    if (e.collection.name !== "training_completions") return;

    const userId     = e.auth ? e.auth.id : null;
    const data       = (e.requestInfo && e.requestInfo.data) ? e.requestInfo.data : {};
    const trainingId = data["training"];

    if (!userId || !trainingId) return;

    let alreadyDone = false;
    try {
        $app.dao().findFirstRecordByFilter("training_completions",
            "training='" + trainingId + "' && user='" + userId + "'"
        );
        alreadyDone = true;
    } catch (_) {}

    if (alreadyDone) {
        throw new BadRequestError("Treinamento já concluído");
    }
})
