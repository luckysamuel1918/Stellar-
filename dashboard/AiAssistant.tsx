import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { useDashboard } from './DashboardLayout';
import { Avatar, formatCurrency } from './components';
import { Sparkles, Send, Loader2 } from 'lucide-react';

// Define message type
interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiAssistantView: React.FC = () => {
    const { user, transactions } = useDashboard();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm your Westcoast Trust AI Assistant. How can I help you with your banking questions today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Initialize the AI chat session once user data is available
    useEffect(() => {
        if (user && transactions && !chatRef.current) {
            try {
                const apiKey = process.env.API_KEY;
                if (!apiKey) {
                    console.error("Failed to initialize AI Assistant: API key is not configured.");
                    setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, the AI Assistant is not configured correctly. Please contact support." }]);
                    return;
                }

                const transactionsSummary = transactions.slice(0, 5).map(t => ({
                  date: t.timestamp?.toDate().toLocaleDateString(),
                  description: t.description,
                  amount: t.amount,
                  type: t.senderId === user.uid ? 'debit' : 'credit'
                }));
                
                const systemInstruction = `You are a helpful and friendly banking assistant for Westcoast Trust Bank.
You can answer questions about banking products, provide financial tips, and help users understand their finances.
You will be provided with a context block containing the user's current balance and recent transactions.
Use this information to answer their questions accurately. Do not make up information.
If the answer isn't in the context, say you don't have access to that information.
Do not provide specific account information or perform transactions.
Keep your answers concise and easy to understand.

Current User Context:
- Name: ${user.fullName}
- Balance: ${formatCurrency(user.balance, user.currencyCode)}
- Recent Transactions: ${JSON.stringify(transactionsSummary, null, 2)}

When answering questions, refer to the user by their first name, ${user.fullName.split(' ')[0]}.
If a user asks a generic question (e.g., 'what is a CD?'), answer it generally.
If a user asks a specific question about their account (e.g., 'what is my balance?' or 'summarize my spending'), use the provided context to answer.
Always be polite and professional. Never perform actions like making transfers or payments.`;

                const ai = new GoogleGenAI({ apiKey });
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: systemInstruction,
                    },
                });
                chatRef.current = newChat;
            } catch (error) {
                console.error("Failed to initialize AI Assistant:", error);
                setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
            }
        }
    }, [user, transactions]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !chatRef.current) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage, { sender: 'ai', text: '' }]);
        setInput('');
        setLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: input });
            
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.sender === 'ai') {
                        lastMessage.text = fullResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("AI response error:", error);
            const errorMessage: Message = { sender: 'ai', text: "I'm sorry, I encountered an error. Could you please try asking again?" };
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                 if (lastMessage.sender === 'ai' && lastMessage.text === '') {
                    newMessages[newMessages.length - 1] = errorMessage;
                    return newMessages;
                 } else {
                    return [...newMessages, errorMessage];
                 }
            });
        } finally {
            setLoading(false);
        }
    };
    
    const AiAvatar = () => (
        <div className="w-10 h-10 rounded-full bg-westcoast-dark flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
        </div>
    );
    
    return (
        <div className="p-4 md:p-0 flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-4 md:hidden">AI Assistant</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex-grow flex flex-col">
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <AiAvatar />}
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-westcoast-blue text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-westcoast-text-dark dark:text-white rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && user && <Avatar user={user} size="w-10 h-10" />}
                        </div>
                    ))}
                     {loading && messages[messages.length - 1]?.text === '' && (
                         <div className="flex items-start gap-3 justify-start">
                            <AiAvatar />
                            <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none flex items-center space-x-2">
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full p-3 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-westcoast-blue focus:outline-none"
                            disabled={loading || !chatRef.current}
                        />
                        <button type="submit" disabled={loading || !input.trim() || !chatRef.current} className="bg-westcoast-blue text-white rounded-lg p-3 disabled:opacity-50 transition-opacity">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantView;
