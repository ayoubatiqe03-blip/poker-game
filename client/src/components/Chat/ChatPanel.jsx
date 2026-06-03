/**
 * components/Chat/ChatPanel.jsx
 *
 * Collapsible side panel chat.
 *
 * Fix: reads messages from GameContext (so server-broadcast chat:message
 * events appear here), rather than needing them passed as a prop.
 * onSendMessage now emits to the server via the prop from App.
 */
import React, { useState, useRef, useEffect } from 'react'
import { useGame } from '../../context/GameContext'

const TYPE_STYLES = {
  chat:   { color: 'var(--text-primary)' },
  system: { color: 'var(--gold)', fontStyle: 'italic', fontSize: 11 },
  action: { color: '#7fb3d3', fontSize: 11 },
  win:    { color: '#f9ca24', fontWeight: 600 },
}

export default function ChatPanel({ onSendMessage, playerName }) {
  const { state } = useGame()
  const messages = state.chat
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const prevLenRef = useRef(messages.length)

  useEffect(() => {
    if (isOpen) {
      setUnread(0)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      const newCount = messages.length - prevLenRef.current
      if (newCount > 0) setUnread(u => u + newCount)
    }
    prevLenRef.current = messages.length
  }, [messages, isOpen])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSendMessage?.(text)
    setInput('')
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => { setIsOpen(o => !o); setUnread(0) }}
        style={{
          position: 'fixed',
          right: isOpen ? 284 : 16,
          bottom: 80,
          width: 42, height: 42,
          borderRadius: '50%',
          background: 'rgba(10,6,2,0.92)',
          border: `1px solid ${unread > 0 ? 'var(--gold)' : 'rgba(201,168,76,0.3)'}`,
          color: unread > 0 ? 'var(--gold)' : 'rgba(201,168,76,0.7)',
          fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 60,
          transition: 'right 0.3s ease, border-color 0.2s',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
        {unread > 0 && !isOpen && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#c0392b',
            color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', right: isOpen ? 0 : -284, top: 0, bottom: 0,
        width: 284,
        background: 'linear-gradient(160deg, rgba(8,5,2,0.97) 0%, rgba(12,7,3,0.97) 100%)',
        borderLeft: '1px solid rgba(201,168,76,0.15)',
        display: 'flex', flexDirection: 'column',
        zIndex: 55,
        transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)' }}>
            Table Chat
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {messages.length} messages
          </span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
              No messages yet
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  color: msg.type === 'system' ? 'var(--gold-dark)' : 'var(--gold)',
                }}>
                  {msg.sender}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {msg.ts}
                </span>
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.5,
                ...TYPE_STYLES[msg.type ?? 'chat'],
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px 14px',
          borderTop: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Say something…"
            maxLength={200}
            style={{
              flex: 1, padding: '8px 10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 34, height: 34, borderRadius: 6,
              background: input.trim() ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${input.trim() ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
              color: input.trim() ? 'var(--gold)' : 'var(--text-muted)',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.15s',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  )
}
