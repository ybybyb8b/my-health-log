/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 添加 iOS 风格的深色调色板
        ios: {
          bg: '#000000',        // 最底层背景
          card: '#1c1c1e',      // 卡片、底栏
          elevated: '#2c2c2e',  // 输入框、次级块
          border: '#38383a',    // 分割线
          text: '#f2f2f7',      // 主要文字
          subtext: '#8e8e93',   // 次要文字
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
