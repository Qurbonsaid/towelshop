import React, { createContext, useContext, useEffect, useState } from 'react'

const HeaderContext = createContext({
  title: 'Towelshop',
  subtitle: null,
  showBack: false,
  backTo: null,
  actions: null,
  setHeader: () => {},
})

export function HeaderProvider({ children }) {
  const [headerState, setHeaderState] = useState({
    title: 'Towelshop',
    subtitle: null,
    showBack: false,
    backTo: null,
    actions: null,
  })

  return (
    <HeaderContext.Provider value={{ ...headerState, setHeader: setHeaderState }}>
      {children}
    </HeaderContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useHeaderContext() {
  return useContext(HeaderContext)
}

/**
 * Hook to set header configuration from any page/screen
 */
// oxlint-disable-next-line react/only-export-components
export function useHeader({ title, subtitle = null, showBack = false, backTo = null, actions = null }, deps = []) {

  const { setHeader } = useHeaderContext()

  useEffect(() => {
    setHeader({
      title,
      subtitle,
      showBack,
      backTo,
      actions,
    })

    return () => {
      // Clean up when unmounting
      setHeader({
        title: 'Towelshop',
        subtitle: null,
        showBack: false,
        backTo: null,
        actions: null,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
