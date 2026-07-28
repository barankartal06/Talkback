const projectUrl = 'https://tumihnziqjculxcpqxny.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWlobnppcWpjdWx4Y3BxeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjE5MzksImV4cCI6MjEwMDYzNzkzOX0.t-0SVFEG1T8BT9ModZykMKIvgEsv_0I5IQLvz6kFlHI'

const { createClient } = supabase
const sb = createClient(projectUrl, anonKey)

let accessToken;

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
const signinEmailInput = document.getElementById('signin-email-input')
const signinPasswordInput = document.getElementById('signin-password-input')
const signinBtn = document.getElementById('signin-btn')
const signinError = document.getElementById('signin-error')
const accountName = document.getElementById('account-name')
const accountEmail = document.getElementById('account-email')
const signoutBtn = document.getElementById('signout-btn')

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

async function signIn() {
    const email = signinEmailInput.value.trim()
    const password = signinPasswordInput.value.trim()
    const {data, error} = await sb.auth.signInWithPassword({ email, password})
    if (error){
        signinError.textContent = error.message
        signinError.classList.remove('hidden')
    } else {
        signinPasswordInput.value = ''
    }
}

sb.auth.onAuthStateChange((event, session) => {
    if (session){
        accessToken = session.access_token
        if(!nameInput.value) nameInput.value = session.user.user_metadata.name
        refreshEntryState()
        showAccountState('account-signedin')
        accountEmail.textContent = session.user.email
        accountName.textContent = session.user.user_metadata.name 
    } else {
        accessToken = null
        nameInput.value = ''
        refreshEntryState()
        showAccountState('account-chooser')
    }

})

function showAccountState(id){
    accountStates.forEach((state) => {
        if (state.id===id){
            state.classList.remove('hidden')
        } else {
            state.classList.add('hidden')
        }
    })
}

function isNonEmpty(input){
    return input.value.trim().length > 0 
}

function signupFieldValidity(){
    const isValid = (isNonEmpty(signupNameInput) && isNonEmpty(signupEmailInput) && isNonEmpty(signupPasswordInput))
    signupBtn.disabled = !isValid
}
signupEmailInput.addEventListener('input', signupFieldValidity)
signupPasswordInput.addEventListener('input', signupFieldValidity)
signupNameInput.addEventListener('input', signupFieldValidity)

function signinFieldValidity(){
    const isValid = (isNonEmpty(signinEmailInput)&&isNonEmpty(signinPasswordInput))
    signinBtn.disabled = !isValid
}
signinEmailInput.addEventListener('input',signinFieldValidity)
signinPasswordInput.addEventListener('input',signinFieldValidity)

signupBtn.addEventListener('click', signUp)
signinBtn.addEventListener('click', signIn)
signoutBtn.addEventListener('click', ()=> sb.auth.signOut())

pendingBackBtn.addEventListener('click', () => showAccountState('account-signin'))
chooseSignupBtn.addEventListener('click', () => showAccountState('account-signup'))
chooseSigninBtn.addEventListener('click', () => showAccountState('account-signin'))
signupBackBtn.addEventListener('click', () => showAccountState('account-chooser'))
signinBackBtn.addEventListener('click', () => showAccountState('account-chooser'))