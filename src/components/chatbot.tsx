
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, X } from 'lucide-react';
import { FaRobot } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { chatWithReview, ChatWithReviewInput } from '@/ai/flows/chat-with-review';
import { useScoringMatrixStore } from '@/store/scoring-matrix-store';
import type { GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';

interface ChatbotProps {
    review: GenerateNonBiasedReviewOutput;
}

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function Chatbot({ review }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { defaultScoringMatrix, customScoringMatrix } = useScoringMatrixStore();
    const scoringMatrix = [...defaultScoringMatrix, ...customScoringMatrix];
    const agentFirstName = review.agentName.split(' ')[0];

    // Set initial welcome message when chatbot opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'model',
                    content: `Hey! If you would like to discuss ${agentFirstName}'s review, let me know...`
                }
            ]);
        }
    }, [isOpen, messages.length, agentFirstName]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatInput: ChatWithReviewInput = {
                reviewContext: review,
                scoringMatrix: scoringMatrix,
                history: [...messages, newUserMessage],
                question: input,
            };

            const response = await chatWithReview(chatInput);
            const botMessage: Message = { role: 'model', content: response };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <Card className="w-80 h-96 shadow-2xl flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                            <FaRobot />
                            Call Sage Chat
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <div key={index} className={cn("flex", message.role === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "rounded-lg px-3 py-2 max-w-[80%] text-sm",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {message.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                         <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                         </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <form onSubmit={handleSendMessage} className="p-4 border-t">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    disabled={isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full w-16 h-16 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
                >
                    <FaRobot className="h-8 w-8 text-primary-foreground" />
                </Button>
            )}
        </div>
    );
}
