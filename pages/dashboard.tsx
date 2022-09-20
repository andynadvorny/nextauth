import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  
  return (
    <h1>dashboard of {user?.email}</h1>
  )
}