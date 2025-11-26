// Marquee Ticker Component for Available Features
interface MarqueeTickerProps {
    isDarkMode: boolean;
}

export default function MarqueeTicker({ isDarkMode }: MarqueeTickerProps) {
    const features = [
        "📚 Course Materials",
        "📝 Past Questions",
        "🔔 Smart Notices",
        "📁 Google Drive",
        "⏰ Class Schedule",
        "📊 Semester Tracker"
    ];

    return (
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 mb-6">
            <div className={`relative overflow-hidden rounded-xl border shadow-sm ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200'
                }`}>
                <div className="flex items-center py-3">
                    {/* Label */}
                    <div className="flex-shrink-0 px-4 border-r border-gray-200 dark:border-gray-700 z-10 bg-inherit">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Updates
                        </span>
                    </div>

                    {/* Scrolling Marquee */}
                    <div className="marquee-container flex-1 overflow-hidden whitespace-nowrap relative">
                        <div className="animate-marquee inline-block">
                            {/* First set of features */}
                            {features.map((feature, index) => (
                                <span key={`first-${index}`}>
                                    <span className={`mx-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>{feature}</span>
                                    {index < features.length - 1 && (
                                        <span className="mx-2 text-gray-400">•</span>
                                    )}
                                </span>
                            ))}
                            <span className="mx-2 text-gray-400">•</span>

                            {/* Duplicate set for seamless loop */}
                            {features.map((feature, index) => (
                                <span key={`second-${index}`}>
                                    <span className={`mx-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>{feature}</span>
                                    {index < features.length - 1 && (
                                        <span className="mx-2 text-gray-400">•</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
