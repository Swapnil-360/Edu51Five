// Marquee Ticker Component for Available Features
interface MarqueeTickerProps {
    isDarkMode: boolean;
}

export default function MarqueeTicker({ isDarkMode }: MarqueeTickerProps) {
    const features = [
        { icon: '📚', label: 'Course Materials & Resources' },
        { icon: '📋', label: 'Exam Questions Archive' },
        { icon: '🔔', label: 'Real-time Notifications' },
        { icon: '☁️', label: 'Cloud Storage Integration' },
        { icon: '📅', label: 'Academic Calendar Tracking' },
        { icon: '📊', label: 'Semester Progress Monitor' },
        { icon: '🗓️', label: 'Class Routine Management' },
        { icon: '👥', label: 'Multi-Section Support' }
    ];

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-6">
            <div className={`relative overflow-hidden rounded-2xl border shadow-md ${isDarkMode ? 'bg-gradient-to-r from-gray-900/70 via-indigo-900/50 to-gray-800/60 border-gray-700/50' : 'bg-white/95 border-gray-200'} `}>
                <div className="flex items-center py-3 px-3 sm:px-4">
                    {/* Label removed - header already displays the title above */}

                    {/* Scrolling Marquee */}
                    <div className="marquee-container flex-1 overflow-hidden whitespace-nowrap relative" aria-hidden="false" role="region" aria-label="Available features ticker">
                        <div className="animate-marquee inline-block" style={{ willChange: 'transform' }}>
                            {/* First set of features */}
                            {features.map((feature, index) => (
                                <span key={`first-${index}`} className="inline-flex items-center mr-6">
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{feature.icon}&nbsp;</span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
                                    {index < features.length - 1 && (
                                        <span className="mx-3 text-gray-400">•</span>
                                    )}
                                </span>
                            ))}

                            {/* Duplicate set for seamless loop */}
                            {features.map((feature, index) => (
                                <span key={`second-${index}`} className="inline-flex items-center mr-6">
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{feature.icon}&nbsp;</span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
                                    {index < features.length - 1 && (
                                        <span className="mx-3 text-gray-400">•</span>
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
