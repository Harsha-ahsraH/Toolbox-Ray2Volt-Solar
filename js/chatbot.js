// Chatbot functionality for Ray2Volt Toolbox
function initChatbot() {
    if (document.getElementById('chatbot-container')) return; // Already injected

    // Inject Chatbot UI into the body
    const chatbotHTML = `
        <div id="chatbot-container">
            <div id="chatbot-window">
                <div class="chatbot-header">
                    <h3>Ray2Volt Assistant</h3>
                    <button class="chatbot-close" id="chatbot-close-btn">&times;</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-message ai">Hi there! I am your AI assistant. I can calculate your EMI or generate previews for your Purchase Orders. Try asking me "Calculate EMI for 500000 at 8% for 5 years" or "Generate a PO for 10 Solar Panels from Luminous".</div>
                </div>
                <div class="chatbot-typing-indicator" id="chatbot-typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <div class="chatbot-input-area">
                    <textarea id="chatbot-input" placeholder="Type your message..." rows="1"></textarea>
                    <button id="chatbot-send" aria-label="Send Message">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
            <button id="chatbot-button" aria-label="Open Chat">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const chatbotButton = document.getElementById('chatbot-button');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('chatbot-typing-indicator');

    // ==========================================
    // GEMINI CONFIGURATION
    // ==========================================
    const GEMINI_API_KEY = "AIzaSyCZwBYivM1tJUuNX8bDgZi4sTARSkO5Nwg"; // Placeholder for the key, as requested by user to hardcode
    const MODEL_NAME = "gemini-3-flash-preview";

    // Chat History
    let conversationHistory = [];

    // System instruction defining the chatbot's behavior and available tools
    const systemInstruction = `You are a helpful AI assistant for the Ray2Volt Solar Toolbox application. 
Your purpose is to help users calculate EMIs or generate Purchase Order previews.
You MUST use your provided tools to fulfill these requests.

When a user asks to calculate an EMI, call the 'calculate_emi' tool with the extracted parameters.
When a user asks to generate a Purchase Order snippet/preview, you must make sure you have:
1. Vendor Name
2. Items (at least one item with name, quantity, and unit price/price)
If any of these are missing, ask the user a follow-up question. Once you have all the info, call 'generate_po_preview'.

Be concise, professional, and friendly. Do not write markdown tables manually if a tool returns HTML; the UI will render the tool output automatically. Just provide a brief conversational response accompanying the tool execution.`;

    // Tool Schemas
    const tools = [
        {
            functionDeclarations: [
                {
                    name: "calculate_emi",
                    description: "Calculates the Equated Monthly Installment (EMI) for a loan.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            loan_amount: { type: "NUMBER", description: "The total principal loan amount." },
                            annual_interest_rate: { type: "NUMBER", description: "The annual interest rate." },
                            loan_tenure_months: { type: "INTEGER", description: "The duration of the loan in months." },
                            method: { type: "STRING", enum: ["reducing", "flat"], description: "The EMI calculation method. Defaults to 'reducing'." }
                        },
                        required: ["loan_amount", "annual_interest_rate", "loan_tenure_months"]
                    }
                },
                {
                    name: "generate_po_preview",
                    description: "Generates a preview layout for a Purchase Order to a vendor.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            vendor_name: { type: "STRING", description: "Name of the vendor." },
                            items: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        name: { type: "STRING" },
                                        quantity: { type: "NUMBER" },
                                        price: { type: "NUMBER" }
                                    },
                                    required: ["name", "quantity", "price"]
                                }
                            }
                        },
                        required: ["vendor_name", "items"]
                    }
                }
            ]
        }
    ];

    // Tool implementation functions
    const toolImplementations = {
        calculate_emi: (args) => {
            const P = args.loan_amount;
            const annualRate = args.annual_interest_rate;
            const N = args.loan_tenure_months;
            const method = args.method || 'reducing';

            let emi, totalInterest, totalPayment;

            if (method === 'reducing') {
                const r = (annualRate / 100) / 12;
                emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                const tenureInYears = N / 12;
                totalInterest = P * (annualRate / 100) * tenureInYears;
                totalPayment = P + totalInterest;
                emi = totalPayment / N;
            }

            const formatRupees = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);

            return `
                <div class="tool-card-preview">
                    <h4>EMI Calculation Result</h4>
                    <table>
                        <tr><th>Loan Amount</th><td>${formatRupees(P)}</td></tr>
                        <tr><th>Interest Rate</th><td>${annualRate}%</td></tr>
                        <tr><th>Tenure</th><td>${N} months</td></tr>
                        <tr><th>Monthly EMI</th><td><strong>${formatRupees(emi)}</strong></td></tr>
                        <tr><th>Total Interest</th><td>${formatRupees(totalInterest)}</td></tr>
                        <tr><th>Total Payment</th><td>${formatRupees(totalPayment)}</td></tr>
                    </table>
                </div>
            `;
        },
        generate_po_preview: (args) => {
            const formatRupees = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
            let totalAmount = 0;

            let itemsHTML = args.items.map(item => {
                const total = item.quantity * item.price;
                totalAmount += total;
                return `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatRupees(item.price)}</td><td>${formatRupees(total)}</td></tr>`;
            }).join('');

            return `
                <div class="tool-card-preview">
                    <h4>Purchase Order Preview</h4>
                    <p><strong>Vendor:</strong> ${args.vendor_name}</p>
                    <table>
                        <thead>
                            <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                            <tr>
                                <th colspan="3" style="text-align: right;">Grand Total:</th>
                                <th>${formatRupees(totalAmount)}</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
    };

    // UI Logic
    chatbotButton.addEventListener('click', () => {
        chatbotWindow.classList.add('open');
        chatbotInput.focus();
    });

    chatbotCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.remove('open');
    });

    chatbotInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    chatbotSend.addEventListener('click', handleSend);

    function addMessage(text, sender, isHTML = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        if (isHTML) {
            msgDiv.innerHTML = text; // Secure context as it's generated by our UI or LLM logic
        } else {
            msgDiv.textContent = text;
        }

        // Append message to the messages container
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function handleSend() {
        if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY" || !GEMINI_API_KEY) {
            alert("Please configure the GEMINI_API_KEY in js/chatbot.js first!");
            return;
        }

        const text = chatbotInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatbotInput.value = '';

        // Keep textarea height reset
        chatbotInput.style.height = 'auto';

        conversationHistory.push({
            role: "user",
            parts: [{ text: text }]
        });

        await processGeminiCall();
    }

    async function processGeminiCall() {
        typingIndicator.classList.add('visible');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

            const payload = {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: conversationHistory,
                tools: tools
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error("HTTP " + response.status + ": " + errorText);
            }

            const data = await response.json();
            const candidate = data.candidates && data.candidates[0];

            if (!candidate) {
                throw new Error("No candidate returned.");
            }

            const part = candidate.content.parts[0];

            // If the model decides to call a function
            if (part && part.functionCall) {
                const funcName = part.functionCall.name;
                const args = part.functionCall.args;

                // Add Assistant's function call message to history
                conversationHistory.push({
                    role: "model",
                    parts: [{ functionCall: { name: funcName, args: args } }]
                });

                let toolOutputHTML = "";
                let resultObj = {};

                if (toolImplementations[funcName]) {
                    try {
                        toolOutputHTML = toolImplementations[funcName](args);
                        resultObj = { success: true, message: "Tool executed successfully." };
                    } catch (err) {
                        resultObj = { success: false, error: err.message };
                    }
                } else {
                    resultObj = { success: false, error: "Tool not found." };
                }

                // Add function response to history
                conversationHistory.push({
                    role: "function",
                    parts: [{ functionResponse: { name: funcName, response: resultObj } }]
                });

                // Render the tool output block in the chat
                if (toolOutputHTML) {
                    addMessage(toolOutputHTML, 'ai', true);
                }

                // Request the next step from Gemini (so it can summarize/apologize/continue)
                await processGeminiCall();
                return;
            } else if (part && part.text) {
                // If it's a normal text response
                let reply = part.text;
                addMessage(reply, 'ai');
                conversationHistory.push({
                    role: "model",
                    parts: [{ text: reply }]
                });
            }

        } catch (err) {
            console.error(err);
            addMessage("API Error: " + err.message, 'ai');
        } finally {
            typingIndicator.classList.remove('visible');
        }
    }

    // Auto-resize textarea
    chatbotInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (Math.min(this.scrollHeight, 100)) + 'px';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
