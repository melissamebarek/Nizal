"use strict";



document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:5000/api/registrations";
    const registrationId = new URLSearchParams(window.location.search).get("id");
    const statusLabels = {
        submitted: "Inscription envoyée",
        under_review: "En cours d’examen",
        accepted: "Acceptée",
        rejected: "Refusée",
        cancelled: "Annulée"
    };
    const statusDescriptions = {
        submitted: "Cette inscription a été envoyée et attend d’être examinée.",
        under_review: "Cette inscription est en cours d’examen.",
        accepted: "Cette inscription a été acceptée.",
        rejected: "Cette inscription a été refusée.",
        cancelled: "Cette inscription a été annulée."
    };
    const statusIcons = {
        submitted: "fa-paper-plane",
        under_review: "fa-magnifying-glass",
        accepted: "fa-check",
        rejected: "fa-xmark",
        cancelled: "fa-ban"
    };

    let registration = null;
    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value, fallback = "—") {
        const element = getElement(id);
        if (element) {
            element.textContent = value === null || value === undefined || value === ""
                ? fallback
                : String(value);
        }
    }

    function formatDate(value, includeTime = false) {
        if (!value) return "—";

        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
        const date = dateOnly
            ? new Date(`${value}T00:00:00`)
            : new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
        }).format(date);
    }

    function formatMoney(value) {
        if (value === null || value === undefined || value === "") return "—";
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "—";
        return `${new Intl.NumberFormat("fr-FR").format(amount)} DZD`;
    }

    function getFullName(item) {
        return [item.first_name, item.last_name].filter(Boolean).join(" ") ||
            "Participant inconnu";
    }

    function showToast(title, message, isError = false) {
        const toast = getElement("toast");
        if (!toast) {
            if (isError) window.alert(message);
            return;
        }

        toast.classList.toggle("error", isError);
        setText("toastTitle", title);
        setText("toastMessage", message);

        const icon = toast.querySelector(".toast-icon i");
        if (icon) {
            icon.className = isError
                ? "fa-solid fa-triangle-exclamation"
                : "fa-solid fa-check";
        }

        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 3500);
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(`${API_URL}/${encodeURIComponent(registrationId)}${path}`, {
            ...options,
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            }
        });

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error("Le serveur a renvoyé une réponse invalide.");
        }

        if (!result || typeof result !== "object") {
            throw new Error("Le serveur a renvoyé une réponse invalide.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(result.message || `Erreur HTTP ${response.status}.`);
        }

        return result;
    }

    function setStatus(status) {
        const normalizedStatus = statusLabels[status] ? status : "submitted";
        const label = statusLabels[normalizedStatus];

        ["statusBadge", "sideStatus"].forEach(id => {
            const badge = getElement(id);
            if (!badge) return;

            badge.className = `status ${normalizedStatus === "under_review" ? "reviewing" : normalizedStatus}`;
            badge.textContent = label;
        });

        setText("statusDescription", statusDescriptions[normalizedStatus]);
    }

    function renderDocuments(documents) {
        const list = getElement("documentsList");
        if (!list) return;

        list.replaceChildren();
        setText("documentCount", `${documents.length} document${documents.length === 1 ? "" : "s"}`);
        setText(
            "summaryDocuments",
            documents.length
                ? `${documents.length} reçu${documents.length === 1 ? "" : "s"}`
                : "Aucun document reçu"
        );

        if (!documents.length) {
            const empty = document.createElement("p");
            empty.className = "empty-documents";
            empty.textContent = "Aucun document n’a été joint à cette inscription.";
            list.append(empty);
            return;
        }

        documents.forEach(item => {
            const row = document.createElement("div");
            row.className = "document-item";

            const iconContainer = document.createElement("div");
            const isImage = /\.(jpe?g|png|gif|webp)$/i.test(item.file_name || "");
            iconContainer.className = `document-icon ${isImage ? "image" : "pdf"}`;
            const icon = document.createElement("i");
            icon.className = `fa-solid ${isImage ? "fa-image" : "fa-file-pdf"}`;
            iconContainer.append(icon);

            const info = document.createElement("div");
            info.className = "document-info";
            const name = document.createElement("strong");
            name.textContent = item.file_name || `Document ${item.id}`;
            const uploadedAt = document.createElement("span");
            uploadedAt.textContent = item.uploaded_at
                ? `Envoyé le ${formatDate(item.uploaded_at)}`
                : "Document envoyé";
            info.append(name, uploadedAt);

            const status = document.createElement("span");
            const documentStatus = item.status || "pending";
            status.className = `document-status ${documentStatus === "approved" ? "valid" : ""}`;
            status.textContent = {
                pending: "À vérifier",
                approved: "Validé",
                rejected: "Refusé"
            }[documentStatus] || documentStatus;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "document-action";
            button.innerHTML = '<i class="fa-solid fa-eye"></i> Voir';
            button.addEventListener("click", () => openDocument(item));

            row.append(iconContainer, info, status, button);
            list.append(row);
        });
    }

    function renderHistory(history) {
        const container = getElement("registrationHistory");
        if (!container) return;

        container.replaceChildren();

        if (!history.length) {
            const empty = document.createElement("p");
            empty.textContent = "Aucun historique disponible.";
            container.append(empty);
            return;
        }

        history.forEach((entry, index) => {
            const item = document.createElement("div");
            item.className = "history-item";

            const status = entry.new_status || "submitted";
            const iconType = status === "under_review" ? "orange" : "blue";
            const iconContainer = document.createElement("div");
            iconContainer.className = `history-icon ${iconType}`;
            const icon = document.createElement("i");
            icon.className = `fa-solid ${statusIcons[status] || "fa-circle"}`;
            iconContainer.append(icon);

            const details = document.createElement("div");
            const heading = document.createElement("strong");
            heading.textContent = statusLabels[status] || status;
            const timestamp = document.createElement("span");
            timestamp.textContent = formatDate(entry.created_at, true);
            details.append(heading, timestamp);

            item.append(iconContainer, details);
            container.append(item);

            if (index < history.length - 1) {
                const line = document.createElement("div");
                line.className = "history-line";
                container.append(line);
            }
        });
    }

    function renderRegistration(data) {
        registration = data;
        const fullName = getFullName(data);
        const initials = [data.first_name, data.last_name]
            .filter(Boolean)
            .map(part => String(part).trim().charAt(0))
            .join("")
            .toUpperCase() || "?";
        const registrationNumber = data.registration_number || `INS-${data.id}`;
        const submittedDate = formatDate(data.registration_date || data.created_at);
        const documents = Array.isArray(data.documents) ? data.documents : [];
        const competitionName = data.competition_name || `Compétition #${data.competition_id}`;
        const competitionMeta = [
            data.category_sport || data.sport,
            data.competition_city,
            formatDate(data.competition_start_date)
        ].filter(value => value && value !== "—").join(" · ");

        document.title = `${registrationNumber} — NIZAL Admin`;
        setText("registrationBreadcrumb", registrationNumber);
        setText("registrationTitle", `Inscription ${registrationNumber}`);
        setText("registrationDate", `Envoyée le ${submittedDate}`);
        setText("participantInitials", initials);
        setText("participantName", fullName);
        setText("participantFullName", fullName);
        setText("participantBirthDate", formatDate(data.date_of_birth));
        setText("participantGender", data.gender || data.category_gender);
        setText("participantCountry", data.country);
        setText("participantEmail", data.email);
        setText("participantPhone", data.phone);
        setText("competitionName", competitionName);
        setText("competitionMeta", competitionMeta);
        setText("categorySport", data.category_sport || data.sport);
        setText("categoryDiscipline", data.category_discipline || data.discipline);
        setText("categoryGender", data.category_gender || data.gender);
        setText("categoryAge", data.category_age || data.age_category);
        setText("categoryWeight", data.category_weight || data.weight_category);
        setText("registrationNumber", registrationNumber);
        setText("registrationCreatedAt", submittedDate);
        setText("registrationFee", formatMoney(data.registration_fee));
        setText("summaryParticipant", fullName);
        setText("summarySport", data.category_sport || data.sport);
        setText(
            "summaryCategory",
            [data.category_age || data.age_category, data.category_weight || data.weight_category]
                .filter(Boolean)
                .join(" · ")
        );
        setText("summaryFee", formatMoney(data.registration_fee));

        const competitionLink = getElement("competitionLink");
        if (competitionLink && data.competition_id) {
            competitionLink.href =
                `../competitions/competition-details.html?id=${encodeURIComponent(data.competition_id)}`;
        }

        setStatus(data.status);
        renderDocuments(documents);
    }

    function openDocument(item) {
        setText("documentTitle", item.file_name || `Document ${item.id}`);
        const preview = getElement("documentPreview");
        const downloadLink = getElement("downloadDocumentBtn");

        if (!preview || !downloadLink || !registration || !item.id) {
            showToast("Document indisponible", "Les informations du document sont incomplètes.", true);
            return;
        }

        const documentUrl =
            `${API_URL}/${encodeURIComponent(registration.id)}/documents/${encodeURIComponent(item.id)}`;
        const extension = String(item.file_name || "").split(".").pop().toLowerCase();
        preview.replaceChildren();

        if (["jpg", "jpeg", "png"].includes(extension)) {
            const image = document.createElement("img");
            image.src = documentUrl;
            image.alt = item.file_name || "Document de l'inscription";
            image.addEventListener("error", () => {
                preview.replaceChildren();
                const errorMessage = document.createElement("p");
                errorMessage.textContent = "Impossible de charger cette image.";
                preview.append(errorMessage);
            }, { once: true });
            preview.append(image);
        } else if (extension === "pdf") {
            const pdf = document.createElement("iframe");
            pdf.src = documentUrl;
            pdf.title = item.file_name || "Document PDF de l'inscription";
            preview.append(pdf);
        } else {
            const errorMessage = document.createElement("p");
            errorMessage.textContent = "Ce format de document ne peut pas être affiché dans l’aperçu.";
            preview.append(errorMessage);
        }

        downloadLink.href = `${documentUrl}?download=1`;
        downloadLink.download = item.file_name || "";
        openModal("documentModal");
    }

    function openModal(id) {
        const modal = getElement(id);
        if (!modal) return;

        modal.classList.add("show");
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(id) {
        const modal = getElement(id);
        if (!modal) return;

        modal.classList.remove("show");
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }

    function bindModalButtons() {
        const openButtons = {
            acceptBtn: "acceptModal",
            rejectBtn: "rejectModal",
            requestInfoBtn: "requestInfoModal",
            cancelRegistrationBtn: "cancelRegistrationModal"
        };
        const closeButtons = {
            closeAcceptModal: "acceptModal",
            cancelAcceptBtn: "acceptModal",
            closeRejectModal: "rejectModal",
            cancelRejectBtn: "rejectModal",
            closeRequestModal: "requestInfoModal",
            cancelRequestBtn: "requestInfoModal",
            closeCancelRegistrationModal: "cancelRegistrationModal",
            keepRegistrationBtn: "cancelRegistrationModal",
            closeDocumentModal: "documentModal",
            closeDocumentBtn: "documentModal"
        };

        Object.entries(openButtons).forEach(([buttonId, modalId]) => {
            const button = getElement(buttonId);
            if (!button) return;
            button.addEventListener("click", event => {
                event.preventDefault();
                openModal(modalId);
            });
        });

        Object.entries(closeButtons).forEach(([buttonId, modalId]) => {
            const button = getElement(buttonId);
            if (!button) return;
            button.addEventListener("click", event => {
                event.preventDefault();
                closeModal(modalId);
            });
        });

        document.querySelectorAll(".modal-overlay").forEach(modal => {
            modal.addEventListener("click", event => {
                if (event.target === modal) closeModal(modal.id);
            });
        });
    }

    
async function submitAction(button, action, successMessage, modalId) {
    if (!registration || !button) return false;

    button.disabled = true;

    try {
        const result = await action();
        const updatedData = result.data || {};

        if (updatedData.status) {
            registration.status = updatedData.status;
            registration.rejection_reason =
                updatedData.rejection_reason ?? null;

            setStatus(updatedData.status);
        }

        closeModal(modalId);

        const isDecision =
            updatedData.status === "accepted" ||
            updatedData.status === "rejected";

        if (isDecision) {
            if (updatedData.email_sent === true) {
                showToast(
                    "Décision enregistrée",
                    `${successMessage} L'email de notification a été envoyé.`
                );
            } else {
                showToast(
                    "Décision enregistrée",
                    `${successMessage} Attention : l'email n'a pas pu être envoyé. ${
                        updatedData.email_error ||
                        "Vérifiez la configuration SMTP du serveur."
                    }`,
                    true
                );
            }
        } else {
            showToast("Modification enregistrée", successMessage);
        }

        // Refresh the registration details and history.
        try {
            const [registrationResult, historyResult] =
                await Promise.all([
                    apiRequest(""),
                    apiRequest("/history")
                ]);

            if (registrationResult.data) {
                renderRegistration(registrationResult.data);
            }

            renderHistory(
                Array.isArray(historyResult.data)
                    ? historyResult.data
                    : []
            );
        } catch (error) {
            console.error(
                "Registration refresh failed:",
                error
            );
        }

        return true;
    } catch (error) {
        console.error("Registration update failed:", error);

        showToast(
            "Erreur",
            error.message || "Impossible de modifier l'inscription.",
            true
        );

        return false;
    } finally {
        button.disabled = false;
    }
}


    function bindActions() {
        const confirmAccept = getElement("confirmAcceptBtn");
        if (confirmAccept) {
            confirmAccept.addEventListener("click", event => {
                event.preventDefault();
                submitAction(
                    confirmAccept,
                    () => apiRequest("/status", {
                        method: "PATCH",
                        body: JSON.stringify({ status: "accepted" })
                    }),
                    "L'inscription a été acceptée.",
                    "acceptModal"
                );
            });
        }

        const confirmReject = getElement("confirmRejectBtn");
        if (confirmReject) {
            confirmReject.addEventListener("click", event => {
                event.preventDefault();
                const reasonField = getElement("rejectionReason");
                const reason = reasonField ? reasonField.value.trim() : "";
                if (!reason) {
                    showToast("Motif obligatoire", "Veuillez saisir le motif du refus.", true);
                    if (reasonField) reasonField.focus();
                    return;
                }

                submitAction(
                    confirmReject,
                    () => apiRequest("/status", {
                        method: "PATCH",
                        body: JSON.stringify({ status: "rejected", reason })
                    }),
                    "L'inscription a été refusée.",
                    "rejectModal"
                ).then(saved => {
                    if (saved && getElement("rejectionReason")) {
                        getElement("rejectionReason").value = "";
                    }
                });
            });
        }

        const confirmRequest = getElement("confirmRequestBtn");
        if (confirmRequest) {
            confirmRequest.addEventListener("click", event => {
                event.preventDefault();
                const messageField = getElement("additionalRequest");
                const message = messageField ? messageField.value.trim() : "";
                if (!message) {
                    showToast("Demande obligatoire", "Veuillez préciser les informations demandées.", true);
                    if (messageField) messageField.focus();
                    return;
                }

                submitAction(
                    confirmRequest,
                    () => apiRequest("/request-info", {
                        method: "PATCH",
                        body: JSON.stringify({ message })
                    }),
                    "La demande d'informations a été envoyée.",
                    "requestInfoModal"
                ).then(saved => {
                    if (saved && getElement("additionalRequest")) {
                        getElement("additionalRequest").value = "";
                    }
                });
            });
        }

        const confirmCancel = getElement("confirmCancelRegistrationBtn");
        if (confirmCancel) {
            confirmCancel.addEventListener("click", event => {
                event.preventDefault();
                submitAction(
                    confirmCancel,
                    () => apiRequest("/status", {
                        method: "PATCH",
                        body: JSON.stringify({ status: "cancelled" })
                    }),
                    "L'inscription a été annulée.",
                    "cancelRegistrationModal"
                );
            });
        }
    }

    async function loadRegistration() {
        if (!registrationId || !/^[1-9]\d*$/.test(registrationId)) {
            throw new Error("Identifiant d'inscription invalide ou manquant.");
        }

        const [registrationResult, historyResult] = await Promise.all([
            apiRequest(""),
            apiRequest("/history")
        ]);

        if (!registrationResult.data) {
            throw new Error("La réponse API ne contient pas les détails de l'inscription.");
        }

        renderRegistration(registrationResult.data);
        renderHistory(Array.isArray(historyResult.data) ? historyResult.data : []);
    }

    bindModalButtons();
    bindActions();
    loadRegistration().catch(error => {
        console.error("Registration details could not be loaded:", error);
        setText("registrationTitle", "Inscription indisponible");
        setText("registrationDate", error.message || "Impossible de charger l'inscription.");
        const details = document.querySelector(".details-layout");
        const notice = document.querySelector(".review-notice");
        const actions = document.querySelector(".header-actions");
        if (details) details.style.display = "none";
        if (notice) notice.style.display = "none";
        if (actions) actions.style.display = "none";
        showToast("Erreur de chargement", error.message || "Impossible de charger l'inscription.", true);
    });
});
