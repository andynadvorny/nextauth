import type { NextPage } from 'next';
import { FormEvent, useContext, useState } from 'react';

import { AuthContext } from '../contexts/AuthContext';
import { withSSRGuest } from '../utils/withSSRGuest';

const Home: NextPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { signIn } = useContext(AuthContext)
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    const data = {
      email,
      password
    }

    await signIn(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">
        Submit
      </button>
    </form>
  )
}

export default Home

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})