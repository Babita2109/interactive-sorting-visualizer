from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "DSA Sorting Visualizer Backend is Running!"


@app.route("/api/sort/bubble", methods=["POST"])
def bubble_sort():

    data = request.get_json()
    array = data.get("array", [])

    arr =array.copy()
    comparisons = 0
    swaps = 0  

    n = len(arr)

    for i in range(n):
        for j in range(0, n - i - 1):

            comparisons += 1

            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swaps += 1

    return jsonify({
                    "algorithm": "Bubble Sort",
                    "original_array": array,
                    "sorted_array" : arr,
                    "comparisons": comparisons,
                    "swaps": swaps,
                    "time_complexity": "O(n^2)",
                    "space_complexity": "O(1)"
                })

@app.route("/api/sort/selection", methods=["POST"])
def selection_sort():
    data = request.get_json()
    array = data.get("array", [])

    arr = array.copy()
    comparisons = 0
    swaps = 0

    n = len(arr)

    for i in range(n):
        min_index = i

        for j in range(i + 1, n):

            comparisons += 1

            if arr[j] < arr[min_index]:
                min_index = j
        
        if min_index != i:
            arr[i], arr[min_index] = arr[min_index], arr[i]
            swaps += 1

    return jsonify({
        "algorithm": "Selection Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "time_complexity": "O(n^2)",
        "space_complexity": "O(1)"
    })

@app.route("/api/sort/insertion", methods=["POST"])
def insertion_sort():

    data = request.get_json()
    array = data.get("array", [])

    arr = array.copy()
    comparisons = 0
    swaps = 0

    n = len(arr)

    for i in range(1, n):

        key = arr[i]
        j = i - 1

        while j >= 0:

            comparisons += 1

            if arr[j] > key:
                arr[j + 1] = arr[j]
                swaps += 1
                j -= 1
            else:
                break

        arr[j + 1] = key

    return jsonify({
        "algorithm": "Insertion Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "time_complexity": "O(n^2)",
        "space_complexity": "O(1)"
    })

def merge_sort_helper(arr):

    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2

    left = merge_sort_helper(arr[:mid])
    right = merge_sort_helper(arr[mid:])

    result = []
    i = 0
    j = 0

    while i < len(left) and j < len(right):

        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])

    return result

@app.route("/api/sort/merge", methods=["POST"])
def merge_sort():

    data = request.get_json()
    array = data.get("array", [])

    arr = array.copy()

    sorted_array = merge_sort_helper(arr)

    return jsonify({
        "algorithm": "Merge Sort",
        "original_array": array,
        "sorted_array": sorted_array,
        "time_complexity": "O(n log n)",
        "space_complexity": "O(n)"
    })

def quick_sort_helper(arr):

    if len(arr) <= 1:
        return arr

    pivot = arr[-1]

    left = []
    right = []

    for value in arr[:-1]:

        if value <= pivot:
            left.append(value)
        else:
            right.append(value)

    return quick_sort_helper(left) + [pivot] + quick_sort_helper(right)

@app.route("/api/sort/quick", methods=["POST"])
def quick_sort():

    data = request.get_json()
    array = data.get("array", [])

    arr = array.copy()

    sorted_array = quick_sort_helper(arr)

    return jsonify({
        "algorithm": "Quick Sort",
        "original_array": array,
        "sorted_array": sorted_array,
        "time_complexity": "O(n log n)",
        "worst_case_time": "O(n^2)",
        "space_complexity": "O(n)"
    })

@app.route("/api/search/linear", methods=["POST"])
def linear_search():

    data = request.get_json()
    array = data.get("array", [])
    target = data.get("target")

    comparisons = 0
    index = -1

    for i in range(len(array)):

        comparisons += 1

        if array[i] == target:
            index = i
            break

    return jsonify({
        "algorithm": "Linear Search",
        "array": array,
        "target": target,
        "index": index,
        "found": index != -1,
        "comparisons": comparisons,
        "time_complexity": "O(n)",
        "space_complexity": "O(1)"
    })

@app.route("/api/search/binary", methods=["POST"])
def binary_search():

    data = request.get_json()
    array = data.get("array", [])
    target = data.get("target")

    low = 0
    high = len(array) - 1
    comparisons = 0
    index = -1

    while low <= high:

        mid = (low + high) // 2
        comparisons += 1

        if array[mid] == target:
            index = mid
            break

        elif array[mid] < target:
            low = mid + 1

        else:
            high = mid - 1

    return jsonify({
        "algorithm": "Binary Search",
        "array": array,
        "target": target,
        "index": index,
        "found": index != -1,
        "comparisons": comparisons,
        "time_complexity": "O(log n)",
        "space_complexity": "O(1)"
    })

if __name__ == "__main__":
    app.run(debug=True)