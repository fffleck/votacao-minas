"use client"

import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const { logout } = useContext(AuthContext)
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
    >
      Sair
    </button>
  )
}
