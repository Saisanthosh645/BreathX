import { useState, useRef, useEffect } from 'react';
import { CurrentAirQualityData, AQIScale, ChatMessage } from '../types/airQuality';
import { askBreatheXAI } from '../services/geminiApi';
import { getCategoryForScale } from '../utils/aqiCalculations';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertCircle,
  Lightbulb,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AIAssistantProps {
  currentData: CurrentAirQualityData | null;
  scale: AQIScale;
}

export function AIAssistant({ currentData, scale }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello! I am BreatheX AI, your real-time environmental intelligence advisor. 

I'm currently connected to verified live telemetry for **${
        currentData?.location.name || 'your location'
      }**. You can ask me about safe outdoor running times, health precautions for children and seniors, what today's AQI means, or how fine PM2.5 particles affect the human body. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const speakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const aqiVal = currentData
    ? scale === 'EAQI'
      ? currentData.europeanAqi
      : scale === 'USAQI'
      ? currentData.usAqi
      : currentData.indAqi
    : null;
  const category = getCategoryForScale(aqiVal, scale);

  const suggestedQuestions = [
    `Is it safe for a 5km outdoor run in ${currentData?.location.name || 'my city'} right now?`,
    'Why is PM2.5 considered more dangerous than PM10?',
    'What precautions should asthma patients and children take today?',
    `Explain today's air quality reading of ${aqiVal ?? 'N/A'} in simple terms.`,
    'How do wind speed and temperature affect local pollution dispersion?',
    'Should I keep windows open for indoor ventilation today?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await askBreatheXAI(
        textToSend,
        currentData,
        category.category
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const isMissingKey =
        err?.message?.includes('GEMINI_API_KEY') ||
        err?.message?.includes('API key is not configured');

      const errText = isMissingKey
        ? 'Gemini API key is not configured in server environment. Please configure GEMINI_API_KEY in the Secrets panel to enable AI responses.'
        : `AI Assistant unavailable: ${err?.message || 'Server error'}. Please try again.`;

      setErrorMessage(errText);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: errText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Conversation cleared. I am ready to analyze new air quality questions for ${
          currentData?.location.name || 'your location'
        }.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner with Context Pill */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Gemini 3.8 Flash Powered Intelligence
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">
            BreatheX AI Assistant
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Conversational environmental science assistant grounded in real-time verified telemetry
          </p>
        </div>

        {/* Live Grounding Pill */}
        {currentData && (
          <div className="bg-[#0D1422] border border-[#1F3045] p-3 rounded-2xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
            <div className="text-xs">
              <span className="text-[#94A3B8] block text-[10px]">Context Loaded:</span>
              <strong className="text-[#F8FAFC]">
                {currentData.location.name} ({scale}: {aqiVal ?? 'N/A'}, PM2.5: {currentData.pollutants.pm2_5 ?? 'N/A'} µg)
              </strong>
            </div>
            <button
              onClick={handleClear}
              title="Clear Conversation"
              className="text-[#94A3B8] hover:text-[#F8FAFC] p-1.5 hover:bg-[#1F3045] rounded-lg transition-colors cursor-pointer ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Suggested Questions Carousel / Chips */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-2 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Suggested Inquiries for {currentData?.location.name}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#111C2D] border border-[#1F3045] hover:border-[#22C55E] text-[#F8FAFC] hover:text-[#22C55E] transition-all cursor-pointer text-left disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-[#111C2D] border border-[#1F3045] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md'
                      : 'bg-[#1F3045] text-[#38BDF8] border border-[#38BDF8]/30 shadow-md'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#22C55E] text-black font-medium shadow-lg shadow-emerald-500/10'
                      : msg.isError
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      : 'bg-[#0D1422] border border-[#1F3045] text-[#F8FAFC]'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[10px] mt-2 font-mono flex items-center justify-between ${
                      isUser ? 'text-black/60 text-right' : 'text-[#94A3B8]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && !msg.isError && (
                      <button
                        onClick={() => speakText(msg.id, msg.text)}
                        title={speakingMsgId === msg.id ? 'Stop Speaking' : 'Read aloud with Voice'}
                        className="text-[#94A3B8] hover:text-[#22C55E] flex items-center gap-1 transition-colors cursor-pointer ml-3 px-1.5 py-0.5 rounded bg-[#111C2D]/80 border border-[#1F3045]"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-[#22C55E]" />
                            <span className="text-[9px] text-[#22C55E]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span className="text-[9px]">Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#1F3045] text-[#38BDF8] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-[#0D1422] border border-[#1F3045] text-xs text-[#94A3B8] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
                <span>BreatheX AI is formulating an evidence-based answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0D1422] border-t border-[#1F3045]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={isLoading}
              title={isListening ? 'Listening... click to stop' : 'Voice Assistant: Speak question'}
              className={`p-3 rounded-xl transition-all cursor-pointer border ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-[#111C2D] border-[#1F3045] text-[#94A3B8] hover:text-[#22C55E] hover:border-[#22C55E]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : `Ask BreatheX AI about air quality, running safely, or health risks in ${
                      currentData?.location.name || 'your area'
                    }...`
              }
              disabled={isLoading}
              className="flex-1 bg-[#111C2D] border border-[#1F3045] focus:border-[#22C55E] rounded-xl px-4 py-3 text-xs md:text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/20"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 px-1 font-mono">
            <span>Powered by Gemini 3.8 Flash • Strictly grounded in real telemetry</span>
            <span className="hidden sm:inline">Educational health intelligence only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
