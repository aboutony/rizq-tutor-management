'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    lesson_id: string | null;
    read: boolean;
    created_at: string;
}

interface LessonDetail {
    id: string;
    status: string;
    student_name: string;
    lesson_label: string;
    requested_start_at_utc: string;
    duration_minutes: number;
}

interface ChatMessage {
    id: string;
    sender: string;
    body: string;
    created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    requested: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pending' },
    confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Confirmed' },
    completed: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Completed' },
    canceled: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Declined' },
};

export default function MessagesPage() {
    const t = useTranslations('tutor_flow.messages_center');

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Lesson detail for expanded view
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
    const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/tutor/notifications', { credentials: 'same-origin' });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (err) {
                console.error('[Messages] Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Load lesson detail + chat when expanding
    const openLesson = useCallback(async (lessonId: string) => {
        if (expandedLesson === lessonId) {
            setExpandedLesson(null);
            return;
        }
        setExpandedLesson(lessonId);
        setLessonDetail(null);
        setChatMessages([]);

        try {
            // Fetch lesson details
            const lessonRes = await fetch(`/api/tutor/lessons/${lessonId}`, { credentials: 'same-origin' });
            if (lessonRes.ok) {
                const data = await lessonRes.json();
                setLessonDetail(data.lesson || data);
            }

            // Fetch chat messages
            const chatRes = await fetch(`/api/tutor/messages/${lessonId}`, { credentials: 'same-origin' });
            if (chatRes.ok) {
                const data = await chatRes.json();
                setChatMessages(data.messages || []);
            }
        } catch (err) {
            console.error('[Messages] Load detail error:', err);
        }
    }, [expandedLesson]);

    // Accept/Decline
    const handleAction = useCallback(async (lessonId: string, action: 'accept' | 'reject') => {
        setActionLoading(`${lessonId}-${action}`);
        try {
            const res = await fetch(`/api/tutor/requests/${lessonId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                // Update lesson detail locally
                setLessonDetail((prev) =>
                    prev ? { ...prev, status: action === 'accept' ? 'confirmed' : 'canceled' } : prev
                );

                // Add system message
                const sysMsg = action === 'accept' ? t('accepted_system') : t('declined_system');
                try {
                    await fetch(`/api/tutor/messages/${lessonId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ body: sysMsg }),
                    });
                } catch { /* system message is best-effort */ }

                // Refresh chat
                const chatRes = await fetch(`/api/tutor/messages/${lessonId}`, { credentials: 'same-origin' });
                if (chatRes.ok) {
                    const data = await chatRes.json();
                    setChatMessages(data.messages || []);
                }
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Action failed');
            }
        } catch (err) {
            console.error('[Messages] Action error:', err);
            alert('Network error');
        } finally {
            setActionLoading(null);
        }
    }, [t]);

    // Send chat message
    const sendMessage = useCallback(async () => {
        if (!chatInput.trim() || !expandedLesson) return;
        setSendingChat(true);
        try {
            const res = await fetch(`/api/tutor/messages/${expandedLesson}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ body: chatInput.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setChatMessages((prev) => [...prev, {
                    id: data.id,
                    sender: 'tutor',
                    body: chatInput.trim(),
                    created_at: data.created_at,
                }]);
                setChatInput('');
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (err) {
            console.error('[Chat] Send error:', err);
        } finally {
            setSendingChat(false);
        }
    }, [chatInput, expandedLesson]);

    // Format time
    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatChatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-fade-in">
            <h1 className="text-lg font-bold text-rizq-text">{t('title')}</h1>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="card !p-8 text-center space-y-3">
                    <div className="text-4xl">📭</div>
                    <p className="text-sm text-rizq-text-muted">{t('empty')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => {
                        const isExpanded = expandedLesson === notif.lesson_id;

                        return (
                            <div key={notif.id} className="card !p-0 overflow-hidden">
                                {/* Request Card */}
                                <button
                                    onClick={() => notif.lesson_id && openLesson(notif.lesson_id)}
                                    className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-rizq-surface-elevated/50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${notif.type === 'booking_request' ? 'bg-blue-500/15' : 'bg-rizq-surface-elevated'
                                        }`}>
                                        {notif.type === 'booking_request' ? '📚' : '🔔'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-rizq-text truncate">{notif.title}</p>
                                        {notif.body && (
                                            <p className="text-xs text-rizq-text-muted truncate mt-0.5">{notif.body}</p>
                                        )}
                                        <p className="text-[10px] text-rizq-text-muted/60 mt-1">{formatTime(notif.created_at)}</p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                    )}
                                </button>

                                {/* Expanded Detail + Chat */}
                                {isExpanded && (
                                    <div className="border-t border-rizq-border/50 animate-fade-in">
                                        {!lessonDetail ? (
                                            <div className="p-6 flex justify-center">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Status Badge + Detail */}
                                                <div className="px-4 py-3 space-y-3 bg-rizq-surface-elevated/30">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
                                ${STATUS_STYLES[lessonDetail.status]?.bg || 'bg-gray-500/15'}
                                ${STATUS_STYLES[lessonDetail.status]?.text || 'text-gray-400'}
                                border-current/20`}>
                                                                {t(`status_${lessonDetail.status}`)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-rizq-text-muted">
                                                            {lessonDetail.duration_minutes} min
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-rizq-text-muted border border-white/10">
                                                            👤 {lessonDetail.student_name}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-rizq-text-muted border border-white/10">
                                                            📚 {lessonDetail.lesson_label}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-rizq-text-muted border border-white/10">
                                                            📅 {formatTime(lessonDetail.requested_start_at_utc)}
                                                        </span>
                                                    </div>

                                                    {/* Accept/Decline Buttons */}
                                                    {lessonDetail.status === 'requested' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAction(lessonDetail.id, 'reject')}
                                                                disabled={!!actionLoading}
                                                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20
                                  hover:bg-red-500/20 disabled:opacity-40 transition-all"
                                                            >
                                                                {actionLoading === `${lessonDetail.id}-reject` ? '...' : t('decline')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(lessonDetail.id, 'accept')}
                                                                disabled={!!actionLoading}
                                                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8]
                                  disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                {actionLoading === `${lessonDetail.id}-accept` ? '...' : t('accept')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Chat Thread */}
                                                <div className="border-t border-rizq-border/30">
                                                    <div className="px-4 py-2 flex items-center gap-2 bg-rizq-surface-elevated/20">
                                                        <span className="text-xs font-bold text-rizq-text-muted">💬 {t('chat')}</span>
                                                    </div>

                                                    <div className="px-4 py-3 space-y-2 max-h-60 overflow-y-auto">
                                                        {chatMessages.length === 0 ? (
                                                            <p className="text-center text-xs text-rizq-text-muted/50 py-4">{t('no_messages')}</p>
                                                        ) : (
                                                            chatMessages.map((msg) => (
                                                                <div key={msg.id} className={`flex ${msg.sender === 'tutor' ? 'justify-end' : 'justify-start'}`}>
                                                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.sender === 'tutor'
                                                                            ? 'bg-[#2563EB]/20 text-blue-200 rounded-br-sm'
                                                                            : msg.sender === 'system'
                                                                                ? 'bg-white/5 text-rizq-text-muted italic text-center w-full'
                                                                                : 'bg-white/10 text-white rounded-bl-sm'
                                                                        }`}>
                                                                        <p>{msg.body}</p>
                                                                        <p className="text-[9px] opacity-40 mt-1">{formatChatTime(msg.created_at)}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                        <div ref={chatEndRef} />
                                                    </div>

                                                    {/* Chat Input */}
                                                    <div className="px-4 py-3 border-t border-rizq-border/30 flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={chatInput}
                                                            onChange={(e) => setChatInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                                            placeholder={t('chat_placeholder')}
                                                            className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-rizq-text
                                placeholder-rizq-text-muted/40 focus:outline-none focus:border-blue-500/40 transition-colors"
                                                        />
                                                        <button
                                                            onClick={sendMessage}
                                                            disabled={sendingChat || !chatInput.trim()}
                                                            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold
                                hover:bg-[#1D4ED8] disabled:opacity-30 transition-all"
                                                        >
                                                            {t('send')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
