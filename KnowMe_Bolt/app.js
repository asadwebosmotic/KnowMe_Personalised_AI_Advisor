// KnowMe Application JavaScript

// Import marked for markdown parsing
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@latest/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@latest/dist/purify.es.js';

class KnowMeApp {
    constructor() {
        this.apiBase = 'http://localhost:8000';
        this.chatHistory = [];
        this.uploadedDocuments = [];
        this.sessionStartTime = Date.now();
        this.currentDeleteFile = null;
        this.currentTab = 'assistant';
        this.personalityData = this.loadPersonalityData();
        this.currentStep = 1;
        this.totalSteps = 7;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startSessionTimer();
        this.loadWelcomeMessage();
        this.loadUploadedDocuments();
        this.setupTabNavigation();
        this.setupPersonalityForm();
        this.loadPersonalityForm();
    }

    setupEventListeners() {
        // Chat input listeners
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', () => this.sendMessage());

        // File upload listeners
        const pdfUpload = document.getElementById('pdf-upload');
        pdfUpload.addEventListener('change', (e) => this.handleFileUpload(e));

        const docUpload = document.getElementById('doc-upload');
        if (docUpload) {
            docUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-tab]');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'semi-active');
        });
        
        const activeItem = document.querySelector(`[data-tab="${tab}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Show/hide sections
        const sections = ['welcome-section', 'chat-section', 'documents-management', 'settings-section'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });
        
        // Update header and show appropriate section
        const headerTitle = document.getElementById('header-title');
        
        switch(tab) {
            case 'assistant':
                if (this.chatHistory.length > 0) {
                    document.getElementById('chat-section').style.display = 'flex';
                    headerTitle.textContent = 'Assistant';
                } else {
                    document.getElementById('welcome-section').style.display = 'flex';
                    headerTitle.textContent = 'Tell me your story, and I\'ll remember it forever.';
                }
                document.getElementById('documents-section').style.display = 'none';
                break;
            case 'documents':
                document.getElementById('documents-management').style.display = 'flex';
                document.getElementById('documents-section').style.display = 'block';
                headerTitle.textContent = 'Documents';
                break;
            case 'settings':
                document.getElementById('settings-section').style.display = 'flex';
                headerTitle.textContent = 'Settings';
                document.getElementById('documents-section').style.display = 'none';
                break;
        }
        
        this.currentTab = tab;
    }

    setupPersonalityForm() {
        const nextBtn = document.getElementById('next-step');
        const prevBtn = document.getElementById('prev-step');
        const saveBtn = document.getElementById('save-personality');
        const form = document.getElementById('personality-form');
        
        nextBtn.addEventListener('click', () => this.nextStep());
        prevBtn.addEventListener('click', () => this.prevStep());
        saveBtn.addEventListener('click', () => this.savePersonality());
        
        // Auto-save on input change
        form.addEventListener('input', () => {
            this.savePersonalityData();
        });
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateFormStep();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateFormStep();
        }
    }

    updateFormStep() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const saveBtn = document.getElementById('save-personality');
        
        prevBtn.style.display = this.currentStep === 1 ? 'none' : 'block';
        nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'block';
        saveBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    }

    savePersonalityData() {
        const form = document.getElementById('personality-form');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        localStorage.setItem('knowme_personality', JSON.stringify(data));
        this.personalityData = data;
    }

    loadPersonalityData() {
        const saved = localStorage.getItem('knowme_personality');
        return saved ? JSON.parse(saved) : {};
    }

    loadPersonalityForm() {
        const form = document.getElementById('personality-form');
        
        Object.keys(this.personalityData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = this.personalityData[key];
            }
        });
    }

    savePersonality() {
        this.savePersonalityData();
        this.showToast('Your personality profile has been saved!', 'success');
        
        // Switch back to assistant tab
        this.switchTab('assistant');
    }

    async loadWelcomeMessage() {
        try {
            const response = await fetch(`${this.apiBase}/`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const welcomeMsg = await response.text();
                console.log('Welcome message:', welcomeMsg);
            }
        } catch (error) {
            console.error('Failed to load welcome message:', error);
        }
    }

    async loadUploadedDocuments() {
        try {
            const response = await fetch(`${this.apiBase}/pdfs/`);
            
            if (response.ok) {
                const data = await response.json();
                this.uploadedDocuments = data.pdfs || [];
                this.updateDocumentList();
                this.updateDocumentCount();
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
            this.showToast('Failed to load documents', 'error');
        }
        this.updateDocumentsGrid();
    }

    updateDocumentList() {
        const documentList = document.getElementById('document-list');
        documentList.innerHTML = '';

        this.uploadedDocuments.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'document-item';
            
            docItem.innerHTML = `
                <div class="document-info">
                    <div class="document-name" title="${doc.name || doc}">${doc.name || doc}</div>
                    <div class="document-size">${doc.size || 'Unknown size'}</div>
                </div>
                <button class="delete-btn" onclick="app.showDeleteModal('${doc.name || doc}')" title="Delete document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                        <path d="M19 6V20A2 2 0 0 1 17 22H7A2 2 0 0 1 5 20V6M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6" stroke="currentColor" stroke-width="2"/>
                        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2"/>
                        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            `;
            
            documentList.appendChild(docItem);
        });
    }

    updateDocumentsGrid() {
        const documentsGrid = document.getElementById('documents-grid');
        documentsGrid.innerHTML = '';

        this.uploadedDocuments.forEach(doc => {
            const docCard = document.createElement('div');
            docCard.className = 'document-card';
            
            docCard.innerHTML = `
                <div class="document-card-header">
                    <h3>${doc.name || doc}</h3>
                    <button class="delete-btn" onclick="app.showDeleteModal('${doc.name || doc}')" title="Delete document">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                            <path d="M19 6V20A2 2 0 0 1 17 22H7A2 2 0 0 1 5 20V6M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6" stroke="currentColor" stroke-width="2"/>
                            <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2"/>
                            <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <p>Size: ${doc.size || 'Unknown'}</p>
            `;
            
            documentsGrid.appendChild(docCard);
        });
    }
    updateDocumentCount() {
        const docCount = document.getElementById('doc-count');
        docCount.textContent = this.uploadedDocuments.length;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            this.showToast('Please select a PDF file', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBase}/upload_pdf/`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(`Successfully uploaded ${result.filename}. ${result.chunks_stored} chunks stored.`, 'success');
                
                // Add to uploaded documents list with file size
                this.uploadedDocuments.push({
                    name: result.filename,
                    size: this.formatFileSize(file.size)
                });
                
                this.updateDocumentList();
                this.updateDocumentCount();
                this.updateDocumentsGrid();
            } else {
                const error = await response.json();
                this.showToast(error.detail || 'Failed to upload PDF', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            // Reset file input
            event.target.value = '';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Hide welcome section and show chat section
        this.switchToChat();

        // Add user message to chat
        this.addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Include personality context in the message
        let contextualMessage = message;
        if (Object.keys(this.personalityData).length > 0) {
            const personalityContext = this.formatPersonalityContext();
            contextualMessage = `${message}\n\n[User Context: ${personalityContext}]`;
        }

        try {
            const response = await fetch(`${this.apiBase}/chat/?user_msg=${encodeURIComponent(contextualMessage)}`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                this.hideTypingIndicator();
                this.addMessage(result.response, 'assistant', result.source, true);
                
                // Store in chat history
                this.chatHistory.push({
                    user: message,
                    assistant: result.response,
                    source: result.source,
                    timestamp: Date.now()
                });
            } else {
                const error = await response.json();
                this.hideTypingIndicator();
                this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'assistant');
                this.showToast(error.detail || 'Chat request failed', 'error');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting. Please check your connection and try again.', 'assistant');
            this.showToast('Connection error. Please try again.', 'error');
        }
    }

    formatPersonalityContext() {
        const context = [];
        
        if (this.personalityData.nickname) context.push(`Name: ${this.personalityData.nickname}`);
        if (this.personalityData.life_focus) context.push(`Focus: ${this.personalityData.life_focus}`);
        if (this.personalityData.motivation) context.push(`Motivation: ${this.personalityData.motivation}`);
        if (this.personalityData.location) context.push(`Location: ${this.personalityData.location}`);
        if (this.personalityData.tone_preference) context.push(`Preferred tone: ${this.personalityData.tone_preference}`);
        if (this.personalityData.response_length) context.push(`Response style: ${this.personalityData.response_length}`);
        
        return context.join(', ');
    }

    handleQuickQuestion(question) {
        const chatInput = document.getElementById('chat-input');
        chatInput.value = question;
        this.sendMessage();
    }

    switchToChat() {
        const welcomeSection = document.getElementById('welcome-section');
        const chatSection = document.getElementById('chat-section');
        const headerTitle = document.getElementById('header-title');
        
        welcomeSection.style.display = 'none';
        chatSection.style.display = 'flex';
        headerTitle.textContent = 'Assistant';
    }

    addMessage(content, sender, source = '', isMarkdown = false) {
        const chatMessages = document.getElementById('chat-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `message-bubble ${sender}`;
        
        if (isMarkdown && sender === 'assistant') {
            // Parse markdown and sanitize HTML
            const htmlContent = marked.parse(content);
            const sanitizedContent = DOMPurify.sanitize(htmlContent);
            bubbleDiv.innerHTML = `<div class="markdown-content">${sanitizedContent}</div>`;
        } else {
            bubbleDiv.textContent = content;
        }
        
        messageDiv.appendChild(bubbleDiv);
        
        if (source && sender === 'assistant') {
            const sourceDiv = document.createElement('div');
            sourceDiv.className = 'message-source';
            sourceDiv.textContent = `Sources: ${Array.isArray(source) ? source.join(', ') : source}`;
            messageDiv.appendChild(sourceDiv);
        }
        
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message assistant';
        
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>KnowMe is typing...</span>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showDeleteModal(filename) {
        this.currentDeleteFile = filename;
        const modal = document.getElementById('delete-modal');
        const filenameSpan = document.getElementById('delete-filename');
        
        filenameSpan.textContent = filename;
        modal.style.display = 'flex';
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.style.display = 'none';
        this.currentDeleteFile = null;
    }

    async confirmDelete() {
        if (!this.currentDeleteFile) return;

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBase}/pdfs/${encodeURIComponent(this.currentDeleteFile)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(result.message || 'Document deleted successfully', 'success');
                
                // Remove from uploaded documents list
                this.uploadedDocuments = this.uploadedDocuments.filter(
                    doc => (doc.name || doc) !== this.currentDeleteFile
                );
                
                this.updateDocumentList();
                this.updateDocumentCount();
                this.updateDocumentsGrid();
                this.closeDeleteModal();
            } else {
                const error = await response.json();
                this.showToast(error.detail || 'Failed to delete document', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Delete failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const sendBtn = document.getElementById('send-btn');
        
        loadingOverlay.style.display = show ? 'flex' : 'none';
        sendBtn.disabled = show;
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    startSessionTimer() {
        setInterval(() => {
            const elapsed = Date.now() - this.sessionStartTime;
            const hours = Math.floor(elapsed / (1000 * 60 * 60));
            const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
            
            const timeDisplay = document.getElementById('session-time');
            timeDisplay.textContent = `${hours}h:${minutes.toString().padStart(2, '0')}m`;
        }, 1000);
    }
}

// Global functions for onclick handlers
window.handleQuickQuestion = (question) => {
    if (window.app) {
        window.app.handleQuickQuestion(question);
    }
};

window.closeDeleteModal = () => {
    if (window.app) {
        window.app.closeDeleteModal();
    }
};

window.confirmDelete = () => {
    if (window.app) {
        window.app.confirmDelete();
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KnowMeApp();
});