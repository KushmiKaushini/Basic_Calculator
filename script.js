class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement
        this.currentOperandTextElement = currentOperandTextElement
        this.clear()
    }

    clear() {
        this.currentOperand = '0'
        this.expression = ''
        this.history = ''
        this.resetNext = false
        this.lastInputWasParenClose = false
    }

    delete() {
        if (this.resetNext) {
            this.clear()
            return
        }
        if (this.currentOperand === '' || this.currentOperand === '0') return
        this.currentOperand = this.currentOperand.toString().slice(0, -1)
        if (this.currentOperand === '' || this.currentOperand === '-') {
            this.currentOperand = '0'
        }
    }

    appendNumber(number) {
        if (this.resetNext) {
            this.currentOperand = ''
            this.resetNext = false
            this.expression = ''
            this.history = ''
            this.lastInputWasParenClose = false
        }

        // If we just closed a paren (e.g. "... )"), and user types number, 
        // we should imply multiplication (e.g. "... ) * 5").
        // For simplicity, let's just assert the user is starting a new operand.
        if (this.lastInputWasParenClose) {
            // Logic choice: Auto-insert '*' or just clear? 
            // Ideally: `expression += ' * '`.
            this.expression += ' * '
            this.lastInputWasParenClose = false
        }

        if (number === '.' && this.currentOperand.includes('.')) return
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString()
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString()
        }
    }

    chooseOperation(operation) {
        if (this.resetNext) {
            this.resetNext = false
            this.history = ''
            this.lastInputWasParenClose = false
        }

        // Allow operation if we have a current number OR if we just closed a paren
        // e.g. "5 +", or "( 1 + 1 ) +"
        if (this.currentOperand === '' && !this.lastInputWasParenClose) return

        // If currentOperand is empty (because of ) close), don't append it
        if (this.currentOperand !== '') {
            this.expression += `${this.currentOperand} ${operation} `
        } else {
            // Just closed paren, append op
            this.expression += `${operation} `
        }

        this.currentOperand = ''
        this.lastInputWasParenClose = false
    }

    addParen(paren) {
        if (this.resetNext) {
            this.clear()
        }

        if (paren === '(') {
            // Implicit multiplication: "5(" -> "5 * ("
            if (this.currentOperand !== '' && this.currentOperand !== '0') {
                this.expression += `${this.currentOperand} * `
                this.currentOperand = ''
            } else if (this.lastInputWasParenClose) {
                this.expression += ` * `
            }

            this.expression += `( `
            this.lastInputWasParenClose = false

        } else if (paren === ')') {
            // Cannot close if we don't have open? (Assuming user knows matching)
            // Push current operand inside
            if (this.currentOperand !== '') {
                this.expression += `${this.currentOperand} ) `
            } else {
                this.expression += `) `
            }
            this.currentOperand = ''
            this.lastInputWasParenClose = true
        }
    }

    toggleSign() {
        if (this.currentOperand === '' || this.currentOperand === '0') return
        this.currentOperand = (parseFloat(this.currentOperand) * -1).toString()
    }

    percentage() {
        if (this.currentOperand === '') return
        const curr = parseFloat(this.currentOperand)
        if (isNaN(curr)) return
        this.currentOperand = (curr / 100).toString()
    }

    compute() {
        // Construct full string
        let fullExpr = this.expression
        if (this.currentOperand !== '') {
            fullExpr += this.currentOperand
        }

        // Improve Sanitization
        let evalExpr = fullExpr
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/\*/g, '*')

        // Handle implicit multiplication for safety (though logic above tries to catch it)
        // e.g. ") (" -> ")*("
        // e.g. "5 (" -> "5*(" (Handled in addParen)

        try {
            // Check for empty expression
            if (evalExpr.trim() === '') return

            const result = new Function('return ' + evalExpr)()

            if (!isFinite(result)) {
                alert("Cannot divide by zero or Result undefined")
                this.clear()
                return
            }

            this.history = fullExpr + ' ='
            this.currentOperand = result.toString()
            this.expression = ''
            this.resetNext = true
            this.lastInputWasParenClose = false

        } catch (error) {
            // console.error(error)
            alert("Invalid Expression")
            this.clear()
        }
    }

    getDisplayNumber(number) {
        if (number === '') return ''
        const stringNumber = number.toString()
        const integerDigits = parseFloat(stringNumber.split('.')[0])
        const decimalDigits = stringNumber.split('.')[1]
        let integerDisplay
        if (isNaN(integerDigits)) {
            if (stringNumber === '-') return '-'
            return ''
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 })
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`
        } else {
            return integerDisplay
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand)

        if (this.resetNext) {
            this.previousOperandTextElement.innerText = this.history
        } else {
            this.previousOperandTextElement.innerText = this.expression
        }
    }
}

const previousOperandTextElement = document.querySelector('[data-previous-operand]')
const currentOperandTextElement = document.querySelector('[data-current-operand]')
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement)

const numberButtons = document.querySelectorAll('[data-number]')
const operationButtons = document.querySelectorAll('[data-operation]')
const equalsButton = document.querySelector('[data-equals]')
const deleteButton = document.querySelector('[data-delete]')
const allClearButton = document.querySelector('[data-all-clear]')
const parenButtons = document.querySelectorAll('[data-paren]')
const plusMinusButton = document.querySelector('[data-plus-minus]')
const percentButton = document.querySelector('[data-percent]')


numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText)
        calculator.updateDisplay()
    })
})

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText)
        calculator.updateDisplay()
    })
})

parenButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.addParen(button.innerText)
        calculator.updateDisplay()
    })
})

plusMinusButton.addEventListener('click', () => {
    calculator.toggleSign()
    calculator.updateDisplay()
})

percentButton.addEventListener('click', () => {
    calculator.percentage()
    calculator.updateDisplay()
})

equalsButton.addEventListener('click', button => {
    calculator.compute()
    calculator.updateDisplay()
})

allClearButton.addEventListener('click', button => {
    calculator.clear()
    calculator.updateDisplay()
})

deleteButton.addEventListener('click', button => {
    calculator.delete()
    calculator.updateDisplay()
})
