// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // 或者 'class'，取决于你的实现，VitePWA通常配合系统自动切换
  theme: {
    extend: {
      colors: {
        // 优化后的 iOS 深色调色板 (基于 Zinc)
        ios: {
          bg: '#000000',          // 纯黑背景 (OLED 省电)
          card: '#1c1c1e',        // 卡片背景 (标准 iOS 深色)
          elevated: '#2c2c2e',    // 模态框/浮层
          border: 'rgba(255, 255, 255, 0.1)', // 更自然的分割线
          text: '#f5f5f7',        // 主要文字 (非纯白，更柔和)
          subtext: '#86868b',     // 次要文字
          input: '#1c1c1e',       // 输入框背景
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
