import Button from './Button'
import CredentialCard from './CredentialCard'
import GoogleButton from './GoogleButton'
import InputStyled from './styled/InputStyled'
import LinkStyled from './styled/LinkStyled'

const SignupCard = () => {
    return (
        <CredentialCard>
            <span className='font-bold text-xl'>Create an account</span>
            <div className="w-full flex gap-x-2">
                <div className="flex flex-col w-full">
                    <span>First Name</span>
                    <InputStyled className="w-fit" type="text" placeholder="Enter your first name..." />
                </div>
                <div className="flex flex-col w-full">
                    <span>Last Name</span>
                    <InputStyled className="w-full" type="text" placeholder="Enter your last name..." />
                </div>
            </div>
            <div className="flex flex-col w-full">
                <span>Email Address</span>
                <InputStyled type="email" placeholder="Enter your email address..." />
            </div>
            <div className="flex flex-col w-full">
                <span>Password</span>
                <InputStyled type="password" placeholder="Enter your password..." />
            </div>
            <div className="flex flex-col w-full">
                <span>Confirm Password</span>
                <InputStyled type="password" placeholder="Enter your password again..." />
            </div>

            <Button>
                Create an account.
            </Button>

            <div className="w-full grid place-items-center mt-2">
                <span>Login using your</span>
                <GoogleButton />
            </div>
            <div className="">
                <span>Already have an account? <LinkStyled to="/signin">Signin here.</LinkStyled></span>
            </div>
        </CredentialCard>
    )
}

export default SignupCard