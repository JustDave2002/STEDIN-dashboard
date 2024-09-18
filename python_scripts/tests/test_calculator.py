import unittest
import sys
import os

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

import calculator  # Import calculator.py from parent directory

class TestCalculator(unittest.TestCase):

    def test_add(self):
        self.assertEqual(calculator.add(2, 3), 5)
        self.assertEqual(calculator.add(-1, -1), -2)
        self.assertEqual(calculator.add(-1, 1), 0)

    def test_subtract(self):
        self.assertEqual(calculator.subtract(3, 2), 1)
        self.assertEqual(calculator.subtract(-1, -1), 0)
        self.assertEqual(calculator.subtract(-1, 1), -2)

    def test_multiply(self):
        self.assertEqual(calculator.multiply(2, 3), 6)
        self.assertEqual(calculator.multiply(-1, -1), 1)
        self.assertEqual(calculator.multiply(-1, 1), -1)

    def test_divide(self):
        self.assertEqual(calculator.divide(6, 3), 2)
        self.assertEqual(calculator.divide(-4, -2), 2)
        self.assertEqual(calculator.divide(-4, 2), -2)
        with self.assertRaises(ValueError):
            calculator.divide(10, 0)

if __name__ == '__main__':
    unittest.main()