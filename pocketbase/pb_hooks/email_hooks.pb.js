/// <reference path="../pb_data/types.d.ts" />

// NOTE: In PocketBase v0.22 JSVM, Handler<T> = (e: T) => void — no e.next().
// Handlers auto-proceed after returning; throw to block.

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendMail(to, subject, htmlBody) {
    if (!to) return;
    try {
        const msg = new MailerMessage({
            from: {
                address: $app.settings().meta.senderAddress || "noreply@empresa.com",
                name: "Intranet"
            },
            to: [{ address: to }],
            subject: subject,
            html: htmlBody,
        });
        $app.newMailClient().send(msg);
    } catch (err) {
        console.error("[email] Falha ao enviar para " + to + ":", String(err));
    }
}

function emailTemplate(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f11;color:#e4e4e7;padding:0;margin:0">
  <div style="max-width:600px;margin:32px auto;background:#1c1c1f;border-radius:16px;overflow:hidden">
    <div style="background:#7c3aed;padding:20px 28px">
      <h1 style="margin:0;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">Intranet Corporativa</h1>
    </div>
    <div style="padding:28px">
      <h2 style="font-size:16px;font-weight:600;margin:0 0 16px 0;color:#f4f4f5">${title}</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #27272a;margin:24px 0">
      <p style="margin:0;font-size:11px;color:#52525b">
        Você recebeu este e-mail porque é usuário da intranet corporativa.<br>
        Não responda este e-mail diretamente.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function appUrl() {
    return ($app.settings().meta.appUrl || "http://localhost").replace(/\/$/, "");
}

function linkButton(href, label) {
    return `<a href="${href}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;margin-top:16px">${label}</a>`;
}

// ── Hook 1: Chamado criado → notificar equipe TI ──────────────────────────────
$app.onRecordAfterCreateRequest().add(function(e) {
    if (e.collection.name !== "tickets") return;
    try {
        const ticket = e.record;
        const tiUsers = $app.dao().findRecordsByFilter("users", "role = 'ti'", "", 0, 0);
        const STATUS_PT = { alta: "Alta 🔴", media: "Média 🟡", baixa: "Baixa 🟢" };
        const priorityLabel = STATUS_PT[ticket.getString("priority")] || ticket.getString("priority");
        const subject = "[Intranet] Novo chamado: " + ticket.getString("title");
        const html = emailTemplate(
            "Novo chamado aberto",
            `<table style="width:100%;border-collapse:collapse;font-size:13px">
               <tr><td style="padding:6px 8px;color:#a1a1aa;width:100px">Título:</td>
                   <td style="padding:6px 8px;color:#f4f4f5;font-weight:600">${ticket.getString("title")}</td></tr>
               <tr><td style="padding:6px 8px;color:#a1a1aa">Categoria:</td>
                   <td style="padding:6px 8px;color:#f4f4f5">${ticket.getString("category")}</td></tr>
               <tr><td style="padding:6px 8px;color:#a1a1aa">Prioridade:</td>
                   <td style="padding:6px 8px;color:#f4f4f5">${priorityLabel}</td></tr>
             </table>
             ${linkButton(appUrl() + "/chamados/" + ticket.id, "Ver chamado")}`.trim()
        );
        tiUsers.forEach(function(u) {
            sendMail(u.email, subject, html);
        });
    } catch (err) { console.error("[email] ticket create:", String(err)); }
});

// ── Hook 2: Chamado atualizado (status) → notificar autor ─────────────────────
$app.onRecordAfterUpdateRequest().add(function(e) {
    if (e.collection.name !== "tickets") return;
    try {
        const ticket = e.record;
        const authorId = ticket.getString("author");
        if (!authorId) return;
        const author = $app.dao().findRecordById("users", authorId);
        const STATUS_PT = {
            aberto: "Aberto", em_andamento: "Em andamento",
            resolvido: "Resolvido ✅", fechado: "Fechado"
        };
        const statusLabel = STATUS_PT[ticket.getString("status")] || ticket.getString("status");
        const subject = "[Intranet] Chamado " + statusLabel + ": " + ticket.getString("title");
        const html = emailTemplate(
            "Seu chamado foi atualizado",
            `<p style="font-size:13px;color:#a1a1aa;margin:0 0 8px 0">Chamado:</p>
             <p style="font-size:15px;font-weight:600;color:#f4f4f5;margin:0 0 16px 0">${ticket.getString("title")}</p>
             <p style="font-size:13px;color:#a1a1aa;margin:0">Novo status:
               <strong style="color:#f4f4f5">${statusLabel}</strong>
             </p>
             ${linkButton(appUrl() + "/chamados/" + ticket.id, "Ver chamado")}`.trim()
        );
        sendMail(author.email, subject, html);
    } catch (err) { console.error("[email] ticket update:", String(err)); }
});

// ── Hook 3: Tarefa atribuída → notificar assignee ─────────────────────────────
$app.onRecordAfterCreateRequest().add(function(e) {
    if (e.collection.name !== "tasks") return;
    try {
        const task = e.record;
        const assigneeId = task.getString("assignee");
        const createdById = task.getString("created_by");
        if (!assigneeId || assigneeId === createdById) return;
        const assignee = $app.dao().findRecordById("users", assigneeId);
        const dueDate = task.getString("due_date");
        const dueLine = dueDate
            ? `<p style="font-size:13px;color:#a1a1aa;margin:8px 0 0 0">Prazo: <strong style="color:#f4f4f5">${dueDate.slice(0,10)}</strong></p>`
            : "";
        const subject = "[Intranet] Nova tarefa atribuída: " + task.getString("title");
        const html = emailTemplate(
            "Nova tarefa atribuída a você",
            `<p style="font-size:15px;font-weight:600;color:#f4f4f5;margin:0 0 8px 0">${task.getString("title")}</p>
             ${task.getString("description") ? `<p style="font-size:13px;color:#a1a1aa;margin:0 0 8px 0">${task.getString("description")}</p>` : ""}
             ${dueLine}
             ${linkButton(appUrl() + "/tarefas", "Ver tarefas")}`.trim()
        );
        sendMail(assignee.email, subject, html);
    } catch (err) { console.error("[email] task create:", String(err)); }
});

// ── Hook 4: Conquista recebida → notificar recipient ──────────────────────────
$app.onRecordAfterCreateRequest().add(function(e) {
    if (e.collection.name !== "achievements") return;
    try {
        const badge = e.record;
        const recipientId = badge.getString("recipient");
        if (!recipientId) return;
        const recipient = $app.dao().findRecordById("users", recipientId);
        const subject = "[Intranet] Você recebeu: " + badge.getString("title") + " " + badge.getString("icon");
        const html = emailTemplate(
            "Você recebeu uma conquista! " + badge.getString("icon"),
            `<div style="text-align:center;padding:16px 0">
               <p style="font-size:40px;margin:0">${badge.getString("icon")}</p>
               <p style="font-size:18px;font-weight:700;color:#f4f4f5;margin:12px 0 8px 0">${badge.getString("title")}</p>
               ${badge.getString("description") ? `<p style="font-size:13px;color:#a1a1aa;margin:0">${badge.getString("description")}</p>` : ""}
             </div>
             ${linkButton(appUrl() + "/conquistas", "Ver conquistas")}`.trim()
        );
        sendMail(recipient.email, subject, html);
    } catch (err) { console.error("[email] achievement create:", String(err)); }
});

// ── Hook 5: Aviso publicado → notificar todos ─────────────────────────────────
$app.onRecordAfterCreateRequest().add(function(e) {
    if (e.collection.name !== "announcements") return;
    try {
        const ann = e.record;
        const authorId = ann.getString("author");
        const PRIORITY_BADGE = { urgent: "🔴 URGENTE", high: "🟠 Importante", normal: "📢" };
        const badge = PRIORITY_BADGE[ann.getString("priority")] || "📢";
        const subject = "[Intranet] " + badge + " " + ann.getString("title");
        const html = emailTemplate(
            badge + " " + ann.getString("title"),
            `<p style="font-size:13px;color:#d4d4d8;margin:0 0 16px 0;line-height:1.6">${ann.getString("content")}</p>
             ${linkButton(appUrl() + "/avisos", "Ver avisos")}`.trim()
        );
        const allUsers = $app.dao().findRecordsByFilter("users", "id != ''", "", 0, 0);
        allUsers.forEach(function(u) {
            if (u.id !== authorId) sendMail(u.email, subject, html);
        });
    } catch (err) { console.error("[email] announcement create:", String(err)); }
});
