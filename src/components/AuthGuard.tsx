import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { verifyToken } from '../api'

interface AuthGuardProps {
    children: React.ReactNode
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('vnote')

            if (!storedToken) {
                navigate('/unauthorized', { replace: true })
                return
            }

            const isValid = await verifyToken(storedToken)

            if (!isValid) {
                localStorage.removeItem('vnote')
                navigate('/unauthorized', { replace: true })
            }
        }

        checkAuth()
    }, [navigate])

    return <>{children}</>
}

export default AuthGuard
