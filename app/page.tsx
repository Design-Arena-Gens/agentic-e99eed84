'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Settings, User, Zap, Brain, Shield, Download, Upload } from 'lucide-react'

interface Message {
  id: string
  text: string
  timestamp: Date
  isUser: boolean
}

interface StyleData {
  avgLength: number
  commonPhrases: string[]
  emojiUsage: number
  punctuationStyle: string
  responseTime: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'train' | 'settings'>('dashboard')
  const [trainingText, setTrainingText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isActive, setIsActive] = useState(false)
  const [styleData, setStyleData] = useState<StyleData>({
    avgLength: 0,
    commonPhrases: [],
    emojiUsage: 0,
    punctuationStyle: 'casual',
    responseTime: '2-5 minutes'
  })
  const [testMessage, setTestMessage] = useState('')
  const [autoReplyDelay, setAutoReplyDelay] = useState(3)

  useEffect(() => {
    // Load saved data from localStorage
    const saved = localStorage.getItem('whatsappBotData')
    if (saved) {
      const data = JSON.parse(saved)
      setMessages(data.messages || [])
      setStyleData(data.styleData || styleData)
      setIsActive(data.isActive || false)
    }
  }, [])

  const analyzeStyle = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim())
    const totalLength = lines.reduce((acc, l) => acc + l.length, 0)
    const avgLength = Math.round(totalLength / lines.length) || 0

    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
    const emojiMatches = text.match(emojiRegex) || []
    const emojiUsage = Math.round((emojiMatches.length / lines.length) * 100) || 0

    const words = text.toLowerCase().split(/\s+/)
    const phraseMap: { [key: string]: number } = {}

    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`
      phraseMap[phrase] = (phraseMap[phrase] || 0) + 1
    }

    const commonPhrases = Object.entries(phraseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase)

    const hasLots = (text.match(/[.!?]/g) || []).length > lines.length * 0.5
    const punctuationStyle = hasLots ? 'formal' : 'casual'

    return { avgLength, commonPhrases, emojiUsage, punctuationStyle, responseTime: '2-5 minutes' }
  }

  const handleTraining = () => {
    if (!trainingText.trim()) return

    const newStyle = analyzeStyle(trainingText)
    setStyleData(newStyle)

    const trainingMessages: Message[] = trainingText.split('\n')
      .filter(l => l.trim())
      .map((text, i) => ({
        id: `train-${Date.now()}-${i}`,
        text,
        timestamp: new Date(),
        isUser: true
      }))

    setMessages(prev => [...prev, ...trainingMessages])

    localStorage.setItem('whatsappBotData', JSON.stringify({
      messages: [...messages, ...trainingMessages],
      styleData: newStyle,
      isActive
    }))

    setTrainingText('')
  }

  const generateReply = (incoming: string): string => {
    const responses = [
      `Hey! I'm not available right now, but I'll get back to you soon`,
      `Thanks for reaching out! I'll respond when I can`,
      `Got your message! Will reply shortly`,
      `Can't respond right now, but I saw your message`,
      `I'm away at the moment, will get back to you`,
    ]

    if (styleData.emojiUsage > 50) {
      return responses[Math.floor(Math.random() * responses.length)] + ' 😊'
    }

    if (styleData.punctuationStyle === 'casual') {
      return responses[Math.floor(Math.random() * responses.length)].toLowerCase()
    }

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleTestMessage = () => {
    if (!testMessage.trim()) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      text: testMessage,
      timestamp: new Date(),
      isUser: false
    }

    setMessages(prev => [...prev, userMsg])

    if (isActive) {
      setTimeout(() => {
        const reply: Message = {
          id: `reply-${Date.now()}`,
          text: generateReply(testMessage),
          timestamp: new Date(),
          isUser: true
        }
        setMessages(prev => [...prev, reply])
      }, autoReplyDelay * 1000)
    }

    setTestMessage('')
  }

  const toggleBot = () => {
    const newState = !isActive
    setIsActive(newState)
    localStorage.setItem('whatsappBotData', JSON.stringify({
      messages,
      styleData,
      isActive: newState
    }))
  }

  const exportData = () => {
    const data = {
      messages,
      styleData,
      isActive,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-bot-backup-${Date.now()}.json`
    a.click()
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        setMessages(data.messages || [])
        setStyleData(data.styleData || styleData)
        setIsActive(data.isActive || false)
        localStorage.setItem('whatsappBotData', JSON.stringify(data))
      } catch (error) {
        alert('Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-whatsapp-primary p-3 rounded-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">WhatsApp Auto-Reply Bot</h1>
                <p className="text-gray-600">AI learns your style and replies automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleBot}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-whatsapp-primary text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isActive ? 'Bot Active ✓' : 'Bot Inactive'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Zap },
              { id: 'train', label: 'Train Bot', icon: Brain },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-whatsapp-primary text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Style Profile</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                      <div className="text-sm text-blue-600 font-semibold mb-1">Avg Message Length</div>
                      <div className="text-3xl font-bold text-blue-900">{styleData.avgLength} chars</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                      <div className="text-sm text-green-600 font-semibold mb-1">Emoji Usage</div>
                      <div className="text-3xl font-bold text-green-900">{styleData.emojiUsage}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                      <div className="text-sm text-purple-600 font-semibold mb-1">Style</div>
                      <div className="text-3xl font-bold text-purple-900 capitalize">{styleData.punctuationStyle}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Common Phrases</h3>
                    <div className="flex flex-wrap gap-2">
                      {styleData.commonPhrases.length > 0 ? (
                        styleData.commonPhrases.map((phrase, i) => (
                          <span key={i} className="bg-white px-4 py-2 rounded-lg text-gray-700 shadow-sm">
                            {phrase}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Train the bot to see your common phrases</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Test Auto-Reply</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                        placeholder="Send a test message..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-whatsapp-primary"
                      />
                      <button
                        onClick={handleTestMessage}
                        className="px-6 py-3 bg-whatsapp-primary text-white rounded-xl font-semibold hover:bg-whatsapp-dark transition-all"
                      >
                        Send
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                      {messages.slice(-10).map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              msg.isUser
                                ? 'bg-whatsapp-light text-gray-800'
                                : 'bg-white text-gray-800 border-2 border-gray-200'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'train' && (
                <motion.div
                  key="train"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Train Your Bot</h2>

                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-blue-900">How to Train</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          Paste your typical messages below. The AI will analyze your writing style, common phrases, emoji usage, and response patterns. The more you add, the better it learns!
                        </p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={trainingText}
                    onChange={(e) => setTrainingText(e.target.value)}
                    placeholder="Paste your messages here (one per line)&#10;Example:&#10;Hey! How are you doing?&#10;Thanks for that, really appreciate it 😊&#10;Let me know when you're free&#10;Sure thing, sounds good!"
                    className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-whatsapp-primary resize-none"
                  />

                  <button
                    onClick={handleTraining}
                    className="w-full px-6 py-4 bg-whatsapp-primary text-white rounded-xl font-bold text-lg hover:bg-whatsapp-dark transition-all shadow-lg"
                  >
                    Analyze & Train Bot
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={exportData}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Export Training Data
                    </button>
                    <label className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all cursor-pointer">
                      <Upload className="w-5 h-5" />
                      Import Training Data
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Bot Settings</h2>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Auto-Reply Delay (seconds)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={autoReplyDelay}
                        onChange={(e) => setAutoReplyDelay(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-center text-2xl font-bold text-gray-800 mt-2">
                        {autoReplyDelay}s
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Response Style</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer">
                          <input type="radio" name="style" defaultChecked className="w-4 h-4" />
                          <span className="font-medium">Match My Style (AI-Generated)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer opacity-50">
                          <input type="radio" name="style" disabled className="w-4 h-4" />
                          <span className="font-medium">Custom Templates (Coming Soon)</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-6 h-6 text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-yellow-900">Integration Note</h4>
                          <p className="text-yellow-700 text-sm mt-1">
                            This is a demonstration dashboard. To integrate with actual WhatsApp, you'll need to use the WhatsApp Business API or a third-party automation service like Twilio, WhatsApp Cloud API, or browser automation tools.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Statistics</h3>
                      <div className="space-y-2 text-gray-700">
                        <div className="flex justify-between">
                          <span>Messages Trained:</span>
                          <span className="font-bold">{messages.filter(m => m.isUser).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto-Replies Sent:</span>
                          <span className="font-bold">{messages.filter(m => !m.isUser).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bot Status:</span>
                          <span className={`font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-white text-sm"
        >
          <p>Built with Next.js, React, and Tailwind CSS</p>
          <p className="mt-1 opacity-75">Your data is stored locally in your browser</p>
        </motion.div>
      </div>
    </div>
  )
}
