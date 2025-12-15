from sympy import *
import re
init_printing(use_unicode=True)

t = symbols('t')
m1, l1, m2, l2, g = symbols('m1 l1 m2 l2 g')
x1, y1, z1, x2, y2, z2 = symbols('x1 y1 z1 x2 y2 z2')
phi1_var, phi2_var, theta1_var, theta2_var = symbols('phi1 phi2 theta1 theta2')
dphi1, dtheta1, dphi2, dtheta2 = symbols('dphi1 dtheta1 dphi2 dtheta2')
ddphi1, ddphi2, ddtheta1, ddtheta2 = symbols('ddphi1 ddphi2 ddtheta1 ddtheta2')
#phi1, theta1, phi2, theta2 = symbols('phi1 theta1 phi2 theta2')

phi1 = Function('phi1')(t)
theta1 = Function('theta1')(t)
phi2 = Function('phi2')(t)
theta2 = Function('theta2')(t)

# Eq(dphi1, diff(phi1, t))
# Eq(dphi2, diff(phi2, t))
# Eq(dtheta1, diff(theta1, t))
# Eq(dtheta2, diff(theta2, t))

x1 = l1 * sin(theta1) * cos(phi1)
y1 = l1 * sin(theta1) * sin(phi1)
z1 = l1 * cos(theta1)

x2 = x1 + l2 * sin(theta2) * cos(phi2)
y2 = y1 + l2 * sin(theta2) * sin(phi2)
z2 = z1 + l2 * cos(theta2)

T1 = (1 / 2) * m1 * (diff(x1, t)**2 + diff(y1, t)**2 + diff(z1, t)**2)
T2 = (1 / 2) * m2 * (diff(x2, t)**2 + diff(y2, t)**2 + diff(z2, t)**2)
T = T1 + T2
U = m1 * g * z1 + m2 * g * z2
L = T - U

firstordersubs = [(Derivative(phi1, t), dphi1), (Derivative(phi2, t), dphi2), (Derivative(theta1, t), dtheta1), (Derivative(theta2, t), dtheta2)]
secondordersubs = [(Derivative(dphi1, t), ddphi1), (Derivative(dphi2, t), ddphi2), (Derivative(dtheta1, t), ddtheta1), (Derivative(dtheta2, t), ddtheta2)]

LP1 = -(diff(L, phi1) - diff(diff(L, diff(phi1, t)), t)).subs(firstordersubs).subs(secondordersubs)
LP2 = -(diff(L, phi2) - diff(diff(L, diff(phi2, t)), t)).subs(firstordersubs).subs(secondordersubs)
LT1 = -(diff(L, theta1) - diff(diff(L, diff(theta1, t)), t)).subs(firstordersubs).subs(secondordersubs)
LT2 = -(diff(L, theta2) - diff(diff(L, diff(theta2, t)), t)).subs(firstordersubs).subs(secondordersubs)

LP1E = -(diff(L, phi1) - diff(diff(L, diff(phi1, t)), t))
LP2E = -(diff(L, phi2) - diff(diff(L, diff(phi2, t)), t))
LT1E = -(diff(L, theta1) - diff(diff(L, diff(theta1, t)), t))
LT2E = -(diff(L, theta2) - diff(diff(L, diff(theta2, t)), t))

#print(latex(LT2E.simplify()))
print(LT2E.simplify())

# LP1 = LP1.simplify()
# LP2 = LP2.simplify()
# LT1 = LT1.simplify()
# LT2 = LT2.simplify()

#expr = LT2

#expr = expand(expr)

# collected = collect(expr, [ddphi1, ddphi2, ddtheta1, ddtheta2], evaluate=False)

# js_code = jscode(collected.get(ddtheta2, 0).simplify(), strict=False)

# js_code = jscode((T+U).simplify().subs(firstordersubs).subs(secondordersubs), strict=False)
# js_code_clean = re.sub(r'\(t\)', '', js_code)
# print(js_code_clean)

# constant = -(expr - collected.get(ddphi1, 0) * ddphi1 - collected.get(ddphi2, 0) * ddphi2 - collected.get(ddtheta1, 0) * ddtheta1 - collected.get(ddtheta2, 0) * ddtheta2)

# js_code = jscode(constant.simplify(), strict=False)

# js_code_clean = re.sub(r'\(t\)', '', js_code)
# print(js_code_clean)


#Solution given by Perplexity but couldn't solve it within 6 hours.
# # Step 2: Prepare the system
# equations = [LP1, LP2, LT1, LT2]
# variables = [ddphi1, ddphi2, ddtheta1, ddtheta2]

# # Step 3: Extract the left-hand side expressions for the system (make sure eq is in the form Eq(expr, 0))
# eqs_expr = [eq.lhs - eq.rhs for eq in equations]  # typically eq.rhs=0, but this generalizes

# # Step 4: Build coefficient matrix A and constants vector b
# coeffs = []
# consts = []
# for eq in eqs_expr:
#     row_coeffs = [eq.coeff(var) for var in variables]
#     coeffs.append(row_coeffs)
#     # constant term = eq with variables removed (negated)
#     const_term = -(eq - sum(c*v for c, v in zip(row_coeffs, variables)))
#     consts.append(const_term)

# A = Matrix(coeffs)
# b = Matrix(consts)

# # Optional: simplify matrix entries to reduce complexity (may help)
# A = A.applyfunc(lambda expr: expr.simplify())
# b = b.applyfunc(lambda expr: expr.simplify())

# # Step 5: Solve the linear system A * X = b for X = [ddphi1, ddphi2, ddtheta1, ddtheta2]
# try:
#     solutions = A.LUsolve(b)
# except Exception as err:
#     # If matrix is singular or other error occurs, try linsolve
#     from sympy import linsolve
#     solutions = list(linsolve(eqs_expr, variables))
#     if solutions:
#         solutions = solutions[0]
#     else:
#         raise err

# # Step 6: Create dictionary of solutions
# sol_dict = {var: sol for var, sol in zip(variables, solutions)}

# # Display solutions
# for var, sol in sol_dict.items():
#     print(f"{var} = {sol}\n")