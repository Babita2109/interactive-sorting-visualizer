
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timezone
import time


# Flask and MongoDB 

app = Flask(__name__)
CORS(app)

client = MongoClient(
    "mongodb://localhost:27017/",
    serverSelectionTimeoutMS=5000
)

db = client["sorting_visualizer"]
history_collection = db["sorting_history"]


# MongoDB history helper


def save_sorting_history(result):
    try:
        document = result.copy()
        document["created_at"] = datetime.now(timezone.utc)

        history_collection.insert_one(document)
        print("Saved to MongoDB successfully!")

        return True

    except Exception as e:
        print("MongoDB save error:", e)
        return False


def finish_result(result):
    """Save a result and return it to the client."""
    saved = save_sorting_history(result)
    result["saved_to_database"] = saved
    return jsonify(result)



# Input validation helpers


def get_array():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return None, None

    array = data.get("array")

    if not isinstance(array, list):
        return None, None

    # bool is deliberately excluded, even though bool is a Python int subtype.
    if not all(type(value) in (int, float) for value in array):
        return None, None

    return data, array


def get_target(data):
    if not isinstance(data, dict):
        return None, False

    target = data.get("target")

    if type(target) not in (int, float):
        return None, False

    return target, True


def is_sorted(array):
    return all(
        array[i] <= array[i + 1]
        for i in range(len(array) - 1)
    )



# Home route


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "DSA Sorting Visualizer Backend is Running!",
        "database": db.name
    })



# MongoDB connection test


@app.route("/api/db-test", methods=["GET"])
def db_test():
    try:
        client.admin.command("ping")

        return jsonify({
            "message": "MongoDB connected successfully!",
            "database": db.name,
            "collection": history_collection.name
        }), 200

    except Exception as e:
        return jsonify({
            "error": "MongoDB connection failed",
            "details": str(e)
        }), 500



# Bubble Sort


@app.route("/api/sort/bubble", methods=["POST"])
def bubble_sort():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    arr = array.copy()
    n = len(arr)
    comparisons = 0
    swaps = 0

    start_time = time.perf_counter()

    for i in range(n):
        swapped = False

        for j in range(n - i - 1):
            comparisons += 1

            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swaps += 1
                swapped = True

        if not swapped:
            break

    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Bubble Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n^2) worst case",
        "space_complexity": "O(1)"
    }

    return finish_result(result)



# Selection Sort

@app.route("/api/sort/selection", methods=["POST"])
def selection_sort():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    arr = array.copy()
    n = len(arr)
    comparisons = 0
    swaps = 0

    start_time = time.perf_counter()

    for i in range(n):
        min_index = i

        for j in range(i + 1, n):
            comparisons += 1

            if arr[j] < arr[min_index]:
                min_index = j

        if min_index != i:
            arr[i], arr[min_index] = arr[min_index], arr[i]
            swaps += 1

    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Selection Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n^2)",
        "space_complexity": "O(1)"
    }

    return finish_result(result)



# Insertion Sort


@app.route("/api/sort/insertion", methods=["POST"])
def insertion_sort():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    arr = array.copy()
    comparisons = 0
    shifts = 0

    start_time = time.perf_counter()

    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1

        while j >= 0:
            comparisons += 1

            if arr[j] > key:
                arr[j + 1] = arr[j]
                shifts += 1
                j -= 1
            else:
                break

        arr[j + 1] = key

    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Insertion Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": shifts,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n^2) worst case",
        "space_complexity": "O(1)"
    }

    return finish_result(result)


# Merge Sort


@app.route("/api/sort/merge", methods=["POST"])
def merge_sort():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    arr = array.copy()
    comparisons = 0

    def merge_sort_recursive(items):
        nonlocal comparisons

        if len(items) <= 1:
            return items

        mid = len(items) // 2

        left = merge_sort_recursive(items[:mid])
        right = merge_sort_recursive(items[mid:])

        merged = []
        i = 0
        j = 0

        while i < len(left) and j < len(right):
            comparisons += 1

            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1

        merged.extend(left[i:])
        merged.extend(right[j:])

        return merged

    start_time = time.perf_counter()
    sorted_arr = merge_sort_recursive(arr)
    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Merge Sort",
        "original_array": array,
        "sorted_array": sorted_arr,
        "comparisons": comparisons,
        "swaps": 0,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n log n)",
        "space_complexity": "O(n)"
    }

    return finish_result(result)

# Quick Sort


@app.route("/api/sort/quick", methods=["POST"])
def quick_sort():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    arr = array.copy()
    comparisons = 0
    swaps = 0

    def quick_sort_recursive(low, high):
        nonlocal comparisons, swaps

        if low >= high:
            return

        pivot = arr[high]
        i = low - 1

        for j in range(low, high):
            comparisons += 1

            if arr[j] <= pivot:
                i += 1

                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    swaps += 1

        pivot_index = i + 1

        if pivot_index != high:
            arr[pivot_index], arr[high] = (
                arr[high],
                arr[pivot_index]
            )
            swaps += 1

        quick_sort_recursive(low, pivot_index - 1)
        quick_sort_recursive(pivot_index + 1, high)

    start_time = time.perf_counter()
    quick_sort_recursive(0, len(arr) - 1)
    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Quick Sort",
        "original_array": array,
        "sorted_array": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n log n) average, O(n^2) worst case",
        "space_complexity": "O(log n) average recursion stack"
    }

    return finish_result(result)


# -----------------------------
# Linear Search
# -----------------------------

@app.route("/api/search/linear", methods=["POST"])
def linear_search():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    target, valid_target = get_target(data)

    if not valid_target:
        return jsonify({
            "error": "Please provide a numeric target."
        }), 400

    comparisons = 0
    found_index = -1

    start_time = time.perf_counter()

    for i, value in enumerate(array):
        comparisons += 1

        if value == target:
            found_index = i
            break

    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Linear Search",
        "array": array,
        "target": target,
        "found": found_index != -1,
        "index": found_index,
        "comparisons": comparisons,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(n)",
        "space_complexity": "O(1)"
    }

    return finish_result(result)


# -----------------------------
# Binary Search
# -----------------------------

@app.route("/api/search/binary", methods=["POST"])
def binary_search():
    data, array = get_array()

    if array is None:
        return jsonify({
            "error": "Please provide an array of numbers."
        }), 400

    if not is_sorted(array):
        return jsonify({
            "error": "Binary Search requires an array sorted in ascending order."
        }), 400

    target, valid_target = get_target(data)

    if not valid_target:
        return jsonify({
            "error": "Please provide a numeric target."
        }), 400

    low = 0
    high = len(array) - 1
    comparisons = 0
    found_index = -1

    start_time = time.perf_counter()

    while low <= high:
        mid = (low + high) // 2
        comparisons += 1

        if array[mid] == target:
            found_index = mid
            break
        elif array[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    execution_time = (time.perf_counter() - start_time) * 1000

    result = {
        "algorithm": "Binary Search",
        "array": array,
        "target": target,
        "found": found_index != -1,
        "index": found_index,
        "comparisons": comparisons,
        "execution_time_ms": round(execution_time, 4),
        "time_complexity": "O(log n)",
        "space_complexity": "O(1)"
    }

    return finish_result(result)


# -----------------------------
# Get saved sorting history
# -----------------------------

@app.route("/api/history", methods=["GET"])
def get_history():
    try:
        records = list(
            history_collection.find()
            .sort("created_at", -1)
            .limit(50)
        )

        for record in records:
            record["_id"] = str(record["_id"])

            if isinstance(record.get("created_at"), datetime):
                record["created_at"] = (
                    record["created_at"].isoformat()
                )

        return jsonify({
            "count": len(records),
            "history": records
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Could not fetch history",
            "details": str(e)
        }), 500


# -----------------------------
# Start server
# -----------------------------

if __name__ == "__main__":
    app.run(
        debug=True,
        use_reloader=False,
        host="127.0.0.1",
        port=5000
    )
