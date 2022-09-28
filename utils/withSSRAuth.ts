import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { destroyCookie, parseCookies } from 'nookies';
import decode from 'jwt-decode'
import { AuthTokenError } from '../errors/AuthTokenError';
import { validateUserPermissions } from './validateUserPermissions';

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth(fn: GetServerSideProps, options?: WithSSRAuthOptions ) {
  return async (ctx: GetServerSidePropsContext) => {
    const cookies = parseCookies(ctx)
    const token = cookies['nextauth.token']

    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if (options) {
      const user = decode<{ permissions: string[], roles: string[] }>(token)
      const { permissions, roles } = options

      const userHadValidPermissions = validateUserPermissions({
        user, 
        permissions,
        roles
      })

      if (!userHadValidPermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }

    try {
      return await fn(ctx)
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextauth.token')
        destroyCookie(ctx, 'nextauth.refreshToken')

        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}