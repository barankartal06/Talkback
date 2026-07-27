const projectUrl = 'https://tumihnziqjculxcpqxny.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWlobnppcWpjdWx4Y3BxeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjE5MzksImV4cCI6MjEwMDYzNzkzOX0.t-0SVFEG1T8BT9ModZykMKIvgEsv_0I5IQLvz6kFlHI'

const { createClient } = supabase
const sb = createClient(projectUrl, anonKey)

const signupEmailInput = document.getElementById('signup-email-input')
const signupPasswordInput = document.getElementById('signup-password-input')
const signupNameInput = document.getElementById('signup-name-input')
const signupError = document.getElementById('signup-error')
const emailEntered = document.getElementById('pending-email')
const signupBtn = document.getElementById('signup-btn')
const chooseSignupBtn = document.getElementById('choose-signup-btn')
const chooseSigninBtn = document.getElementById('choose-signin-btn')
const signupBackBtn = document.getElementById('signup-back-btn')
const signinBackBtn = document.getElementById('signin-back-btn')
const pendingBackBtn = document.getElementById('pending-back-btn')
const accountStates = document.querySelectorAll('#panel-account .entry-card')

async function signUp() {
    const email = signupEmailInput.value.trim()
    const password = signupPasswordInput.value.trim()
    const name = signupNameInput.value.trim()

    const { data, error } = await sb.auth.signUp({email, password, options: {data: {name} } })
    if (error){
        signupError.textContent = error.message
        signupError.classList.remove('hidden')
    } else {
        showAccountState('account-pending')
        emailEntered.textContent=email
        signupPasswordInput.value = ''
    }
}

function showAccountState(id){
    accountStates.forEach((state) => {
        if (state.id===id){
            state.classList.remove('hidden')
        } else {
            state.classList.add('hidden')
        }
    })
}

signupBtn.addEventListener('click', signUp)

pendingBackBtn.addEventListener('click', () => showAccountState('account-signin'))
chooseSignupBtn.addEventListener('click', () => showAccountState('account-signup'))
chooseSigninBtn.addEventListener('click', () => showAccountState('account-signin'))
signupBackBtn.addEventListener('click', () => showAccountState('account-chooser'))
signinBackBtn.addEventListener('click', () => showAccountState('account-chooser'))