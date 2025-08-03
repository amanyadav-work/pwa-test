'use client'

import { Navbar1 } from "@/components/ui/Header"

const MainLayout = ({ children }) => {
    return (
        <>
            <header>
                <Navbar1 />
            </header>
            {children}
        </>
    )
}

export default MainLayout