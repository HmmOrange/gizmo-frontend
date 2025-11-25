import { createContext, useContext, useState } from "react"

const ThemeContext = createContext({
  theme: "system",
  setTheme: () => {},
})

export const ThemeProvider = ({
  children
}) => {
  const [theme, setTheme] = useState("system")

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext)

