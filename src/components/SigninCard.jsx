import { Link } from 'react-router-dom'
import Button from '../components/Button'
import CredentialCard from '../components/CredentialCard'
import GoogleButton from './GoogleButton'
import InputStyled from './styled/InputStyled'

const SigninCard = () => {
    return (
        <CredentialCard>
            <span className='font-bold text-xl'>Login to your account</span>
            <div className="flex flex-col  w-full">
                <span>Email Address</span>
                <InputStyled type="email" placeholder="Enter your email address..." />
            </div>
            <div className="flex flex-col w-full">
                <span>Password</span>
                <InputStyled type="password" placeholder="Enter your password..." />
                <Link to="/forgot-password" className='text-blue-900 hover:underline text-sm'>Forgot password?</Link>
            </div>

            <Button>
                Login
            </Button>

            <div className="w-full">
                <span>Login using your</span>
                <GoogleButton />
            </div>
        </CredentialCard>
    )
}

export default SigninCard