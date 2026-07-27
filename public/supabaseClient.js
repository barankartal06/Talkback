const projectUrl = 'https://tumihnziqjculxcpqxny.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWlobnppcWpjdWx4Y3BxeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjE5MzksImV4cCI6MjEwMDYzNzkzOX0.t-0SVFEG1T8BT9ModZykMKIvgEsv_0I5IQLvz6kFlHI'

const { createClient } = supabase
const sb = createClient(projectUrl, anonKey)

const emailInput = document.getElementById('email-input')
const passwordInput = document.getElementById('password-input')
const signNameInput = document.getElementById('signup-name-input')
const accountError = document.getElementById('account-error')
const signedOut = document.getElementById('account-signedout')
const emailEntered = document.getElementById('pending-email')
const verifyState = document.getElementById('account-pending')
const signupBtn = document.getElementById('signup-btn')
const pendingBackBtn = document.getElementById('pending-back-btn')

async function signUp() {
    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()
    const name = signNameInput.value.trim()

    const { data, error } = await sb.auth.signUp({email, password, options: {data: {name} } })
    if (error){
        accountError.textContent = error.message
        accountError.classList.remove('hidden')
    } else {
        signedOut.classList.add('hidden')
        emailEntered.textContent=email
        verifyState.classList.remove('hidden')
        passwordInput.value = ''
    }
}

signupBtn.addEventListener('click', signUp)

pendingBackBtn.addEventListener('click', () => {
    verifyState.classList.add('hidden')
    signedOut.classList.remove('hidden')
})