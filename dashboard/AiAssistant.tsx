import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { useDashboard } from './DashboardLayout';
import { Avatar } from './components';
import { Sparkles, Send, Loader2 } from 'lucide-react';

// Define message type
interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiAssistantView: React.FC = () => {
    const { user } = useDashboard();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm your Westcoast Trust AI Assistant. How can I help you with your banking questions today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Initialize the AI chat session
    useEffect(() => {
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                console.error("Failed to initialize AI Assistant: API key is not configured.");
                setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, the AI Assistant is not configured correctly. Please contact support." }]);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are a helpful and friendly banking assistant for Westcoast Trust Bank. You can answer questions about banking products, provide financial tips, and help users understand their finances. Do not provide specific account information or perform transactions. Keep your answers concise and easy to understand.",
                },
            });
            chatRef.current = newChat;
        } catch (error) {
            console.error("Failed to initialize AI Assistant:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        }
    }, []);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !chatRef.current) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: input });
            const aiMessage: Message = { sender: 'ai', text: response.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("AI response error:", error);
            const errorMessage: Message = { sender: 'ai', text: "I'm sorry, I encountered an error. Could you please try asking again?" };
            setMessages(prev => [...prev, errorMessage]);
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
        <div className="p-4 md:p-0 flex flex-col h-[calc(100vh-10rem)] md:h-auto">
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
                    {loading && (
                         <div className="flex items-start gap-3 justify-start">
                            <AiAvatar />
                            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-westcoast-text-dark dark:text-white rounded-bl-none flex items-center">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
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
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()} className="bg-westcoast-blue text-white rounded-lg p-3 disabled:opacity-50 transition-opacity">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantView;