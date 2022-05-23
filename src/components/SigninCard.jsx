import { Link } from 'react-router-dom'
import Button from '../components/Button'
import CredentialCard from '../components/CredentialCard'
import GoogleButton from './GoogleButton'
import Input from './Input'

const SigninCard = () => {
    return (
        <div>
            <CredentialCard>
                <span className='font-bold text-xl'>Login to your account</span>
                <div className="flex flex-col">
                    <span>Email Address</span>
                    <Input type="email" placeholder="Enter your email address..." />
                </div>
                <div className="flex flex-col">
                    <span>Password</span>
                    <Input type="password" placeholder="Enter your password..." />
                    <Link to="/forgot-password" className='text-blue-900 hover:underline text-sm'>Forgot password?</Link>
                </div>

                <Button>
                    Login
                </Button>

                <div className="">
                    <span>Login using your</span>
                    <GoogleButton />
                </div>
            </CredentialCard></div>
    )
}

export default SigninCard