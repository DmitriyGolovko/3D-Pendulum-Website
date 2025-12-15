
import numpy as np

A = np.array([[1.00001, -0.00009801014214920459, 0, -0.49973426618243594],
             [-1, 0.00068115199172444, -0.998179298524464, 0],
             [0, -0.00006933210996166031, 1.00001, 0.14571579850435787],
             [-0.7083109643812892, 0, 0.29143159700871574, 1.00001]])

b = np.array([0.00021165788805066444, -0.0014069039383341724, 0.5050556613347721, 0.00001629321081045201])

x = np.array([-0.002326691350226608, 858.9621229690783, 0.5898913722566757, -0.17354297703194166])


la = 1e-10

solution = np.linalg.solve(A, b)

solution1 = np.linalg.matmul(np.transpose(A), A) + la * np.identity(4)
solution1 = np.linalg.inv(solution1)
solution1 = np.linalg.matmul(solution1, np.transpose(A))
solution1 = np.linalg.matmul(solution1, b)

print(solution1)

print(A @ solution)
print(A @ solution1)


#print(np.linalg.matmul(np.transpose(A), A))