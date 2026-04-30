/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forest: {
                    900: '#0f1f14',
                    800: '#173322',
                    700: '#1f4830',
                    600: '#2a6344',
                    500: '#388358',
                    400: '#4da672',
                    300: '#7acc95',
                    200: '#ace6c4',
                    100: '#d7f2e1',
                    50: '#eff9f3',
                },
                alert: {
                    900: '#3b0d0c',
                    800: '#5c1411',
                    700: '#8c1f1a',
                    600: '#b82922',
                    500: '#e03028',
                    400: '#f05a54',
                    300: '#faa39d',
                    200: '#fcd3d0',
                    100: '#fef1f0',
                    50: '#fffcfc',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
