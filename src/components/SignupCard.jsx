import Button from './Button'
import CredentialCard from './CredentialCard'
import GoogleButton from './GoogleButton'
import Input from './Input'
import LinkStyled from './styled/LinkStyled'

const SignupCard = () => {
    return (
        <CredentialCard>
            <span className='font-bold text-xl'>Create an account</span>
            <div className="flex gap-x-2">
                <div className="flex flex-col w-fit">
                    <span>First Name</span>
                    <Input className="w-fit" type="text" placeholder="Enter your first name..." />
                </div>
                <div className="flex flex-col">
                    <span>Last Name</span>
                    <Input className="w-fit" type="text" placeholder="Enter your last name..." />
                </div>
            </div>
            <div className="flex flex-col w-full">
                <span>Email Address</span>
                <Input type="email" placeholder="Enter your email address..." />
            </div>
            <div className="flex flex-col w-full">
                <span>Password</span>
                <Input type="password" placeholder="Enter your password..." />
            </div>
            <div className="flex flex-col w-full">
                <span>Confirm Password</span>
                <Input type="password" placeholder="Enter your password again..." />
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