import React, { useEffect, useState } from 'react';

const THEMES = ['edu51', 'default', 'retro', 'cyberpunk', 'valentine', 'aqua'];


export default function ThemeDropdown() {
  const [theme, setTheme] = useState<string>(() => {
    return (localStorage.getItem('eduTheme') || 'edu51');
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('eduTheme', theme);
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [theme]);

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-sm btn-ghost text-base-content"> 
        Theme
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60 ml-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048">
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul tabIndex={-1} className="dropdown-content bg-base-100 rounded-box z-50 w-52 p-2 shadow-2xl">
        {THEMES.map(t => (
          <li key={t}>
            <label className={`w-full btn btn-sm btn-block justify-start cursor-pointer transition ${theme === t ? 'bg-primary text-primary-content' : 'btn-ghost'}`}>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller sr-only"
                aria-label={t}
                value={t}
                checked={theme === t}
                onChange={() => setTheme(t)}
              />
              <span className="ml-2 capitalize">{t}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
