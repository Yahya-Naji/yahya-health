from enum import Enum


class Verdict(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    HARD_FAIL = "HARD_FAIL"
