import { useContext } from "react"
import { Can } from "../components/Can"
import { AuthContext } from "../contexts/AuthContext"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext)
  
  return (
    <>
      <h1>dashboard of {user?.email}</h1>
      <Can permissions={['metrics.list']}>
        <div>metrics</div>
      </Can>
      <button onClick={signOut}>sign out</button>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  return {
    props: {}
  }
})