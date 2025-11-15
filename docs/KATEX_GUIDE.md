# KaTeX Equation Guide for IITian Squad

## Basic Syntax

### Inline vs Block
- **Inline**: `$E=mc^2$` (within text)
- **Block**: `$$F=ma$$` (centered, larger)

## Mathematics

### Basic Operations
```latex
$a + b$         # Addition
$a - b$         # Subtraction  
$a \times b$    # Multiplication
$a \div b$      # Division
$\frac{a}{b}$   # Fraction
```

### Powers & Roots
```latex
$x^2$           # x²
$x^{10}$        # x¹⁰ (use braces for multi-digit)
$x_1$           # x₁ (subscript)
$\sqrt{x}$      # √x
$\sqrt[3]{x}$   # ∛x
```

### Matrices

**Basic Matrix:**
```latex
$$\begin{matrix}
a & b \\
c & d
\end{matrix}$$
```

**Matrix with Brackets (Alternative - bmatrix not fully supported):**
```latex
$$\left[\begin{array}{ccc}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{array}\right]$$
```

**Matrix with Parentheses:**
```latex
$$\begin{pmatrix}
x & y \\
z & w
\end{pmatrix}$$
```

**Determinant:**
```latex
$$\begin{vmatrix}
a & b \\
c & d
\end{vmatrix} = ad - bc$$
```

**System of Equations:**
```latex
$$\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}$$
```

### Calculus
```latex
$\frac{d}{dx}$              # Derivative
$\int_0^1 x^2 dx$          # Integral
$\lim_{x \to 0} f(x)$      # Limit
$\sum_{i=1}^{n} i$         # Summation
```

## Physics

### Common Formulas
```latex
$F = ma$                    # Newton's 2nd Law
$E = mc^2$                  # Mass-energy
$v = u + at$                # Kinematics
$KE = \frac{1}{2}mv^2$     # Kinetic energy
$V = IR$                    # Ohm's law
$F = k\frac{q_1q_2}{r^2}$  # Coulomb's law
```

### Units
```latex
$v = 25 \text{ m/s}$
$F = 10 \text{ N}$
$a = 9.8 \text{ m/s}^2$
```

## Chemistry

### Formulas
```latex
$H_2O$          # Water
$CO_2$          # Carbon dioxide
$H_2SO_4$       # Sulfuric acid
$CaCO_3$        # Calcium carbonate
```

### Reactions
```latex
$2H_2 + O_2 \rightarrow 2H_2O$
$CH_4 + 2O_2 \rightarrow CO_2 + 2H_2O$
```

### Reaction Conditions
```latex
$A \xrightarrow{\text{heat}} B$                    # Above arrow
$A \xrightarrow[\text{pressure}]{} B$              # Below arrow
$A \xrightarrow[\text{300°C}]{\text{catalyst}} B$  # Above & below
```

### Equilibrium
```latex
$A + B \rightleftharpoons C + D$
$K_c = \frac{[C][D]}{[A][B]}$
```

## Greek Letters
```latex
$\alpha$ $\beta$ $\gamma$ $\delta$ $\epsilon$
$\theta$ $\lambda$ $\mu$ $\pi$ $\sigma$ $\omega$
```

## Special Symbols
```latex
$\infty$        # ∞ infinity
$\pm$           # ± plus-minus
$\neq$          # ≠ not equal
$\leq$          # ≤ less/equal
$\geq$          # ≥ greater/equal
$\approx$       # ≈ approximately
$\rightarrow$   # → arrow
```

## KaTeX Limitations

### ❌ Not Supported in KaTeX
```latex
# Commutative diagrams (use images instead)
\begin{CD}
A @>>> B \\
@VVV @AAA \\
C @= D
\end{CD}

# bmatrix environment (use array instead)
\begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix}

# Complex chemistry structures (use ChemDraw images)
# TikZ diagrams (use drawing tools)
# Some advanced LaTeX packages
```

### ✅ Use These Instead
**For Matrices with Brackets:**
```latex
$$\left[\begin{array}{cc} a & b \\ c & d \end{array}\right]$$
$$\left[\begin{array}{ccc} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{array}\right]$$
```

**For Matrices with Parentheses:**
```latex
$$\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$$
```

**For Systems of Equations:**
```latex
$$\begin{cases} x + y = 1 \\ x - y = 0 \end{cases}$$
```

## Common Mistakes

| ❌ Wrong | ✅ Correct | Issue |
|----------|------------|-------|
| `$x^10$` | `$x^{10}$` | Multi-digit needs braces |
| `$log x$` | `$\log x$` | Functions need backslash |
| `$H2O$` | `$H_2O$` | Subscripts need underscore |
| `$1/2$` | `$\frac{1}{2}$` | Use proper fractions |
| `\begin{CD}` | Use images | Commutative diagrams not supported |

## External Resources

### Documentation
- **KaTeX Docs**: https://katex.org/docs/supported.html
- **Function Support**: https://katex.org/docs/support_table.html

### Online Tools
- **KaTeX Live Editor**: https://katex.org/
- **LaTeX Editor**: https://www.codecogs.com/latex/eqneditor.php
- **Symbol Finder**: http://detexify.kirelabs.org/classify.html

### Chemistry Tools
- **ChemSketch** (Free): https://www.acdlabs.com/resources/free-chemistry-software-apps/chemsketch/
- **Ketcher** (Open Source): https://lifescience.opensource.epam.com/ketcher/

## Quick Examples

### Physics Question
```latex
A particle has velocity $v = 10t^2$ m/s. Find acceleration at t=2s.

Given: $$v = 10t^2$$
We know: $$a = \frac{dv}{dt}$$
Solution: $$a = \frac{d(10t^2)}{dt} = 20t$$
At t=2s: $$a = 20 \times 2 = 40 \text{ m/s}^2$$
```

### Chemistry Question
```latex
Balance the equation:
$$C_2H_6 + O_2 \xrightarrow{\text{combustion}} CO_2 + H_2O$$

Answer: $$2C_2H_6 + 7O_2 \rightarrow 4CO_2 + 6H_2O$$
```

---
*For complex chemical structures, use image uploads instead of KaTeX*
