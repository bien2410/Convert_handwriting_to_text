const imageGrid = document.getElementById("image-grid");
const fileInput = document.getElementById("file-input");
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const nameModelImage = document.getElementById("image-name")
const closeModal = document.getElementById("close-modal");
const convertButton = document.getElementById("convert-button")
const loadingPopup = document.getElementById("loadingPopup");
const page1 = document.getElementById("page1")
const page2 = document.getElementById("page2")
const imageDisplay = document.getElementById("display-image")
const highlightedText = document.getElementById("highlighted-text")
const editText = document.getElementById("editable-textarea")
const prevPage = document.getElementById("prevPage")
const nextPage = document.getElementById("nextPage")
const downloadButton = document.getElementById("download-button")

let draggedItem = null;
let currentPage = 0;
let totalPage = 0;
let convertResults = []
let editableResults = []

document.querySelector(".site-title").addEventListener("click", display1);
// document.querySelector(".site-title").addEventListener("click", window.location.reload());

fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (event) => {

            const imageItem = document.createElement("div");
            imageItem.classList.add("image-item");
            imageItem.setAttribute("draggable", true);
            imageItem.innerHTML = `
                <img src="${event.target.result}" alt="${file.name}" />
                <p>${file.name}</p>
                <div class="actions">
                    <button class="view" onclick="viewImage('${event.target.result}', '${file.name}')">🔍</button>
                    <button class="delete" onclick="deleteImage(this)">🗑️</button>
                </div>
            `;
            addDragAndDropListeners(imageItem);
            imageGrid.appendChild(imageItem);
            if (imageGrid.children.length > 0) {
                convertButton.style.display = "block";
            }
        };
        reader.readAsDataURL(file);
    });
    
});

function addDragAndDropListeners(item) {
    item.addEventListener("dragstart", (e) => {
        draggedItem = item;
        e.dataTransfer.effectAllowed = "move";
        item.style.opacity = "0.5";
    });

    item.addEventListener("dragend", () => {
        draggedItem.style.opacity = "1";
        draggedItem = null;
    });

    item.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    item.addEventListener("dragenter", (e) => {
        e.preventDefault();
        if (e.target.classList.contains("image-item") && draggedItem !== e.target) {
            e.target.classList.add("drag-over");
        }
    });

    item.addEventListener("dragleave", (e) => {
        if (e.target.classList.contains("image-item")) {
            e.target.classList.remove("drag-over");
        }
    });

    item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.target.classList.contains("image-item") && draggedItem !== e.target) {
            const currentIndex = Array.from(imageGrid.children).indexOf(e.target);
            const draggedIndex = Array.from(imageGrid.children).indexOf(draggedItem);

            if (currentIndex > draggedIndex) {
                e.target.insertAdjacentElement("afterend", draggedItem);
            } else {
                e.target.insertAdjacentElement("beforebegin", draggedItem);
            }
        }
        e.target.classList.remove("drag-over");
    });
}

function viewImage(url, fileName) {
    modalImage.src = url;
    nameModelImage.textContent = fileName;
    modal.style.display = "flex";

}

function deleteImage(button) {
    const imageItem = button.closest(".image-item");
    imageItem.remove();
    if (imageGrid.children.length === 0) {
        convertButton.style.display = "none";
    }
}

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


convertButton.addEventListener("click", () => {
    const formData = new FormData();

    // Lấy tất cả ảnh từ grid và chuyển đổi thành Blob
    const images = Array.from(imageGrid.children).map((imageItem) => {
        const img = imageItem.querySelector("img");
        const dataURL = img.src;

        // Chuyển dataURL thành Blob
        const byteString = atob(dataURL.split(",")[1]); // Giải mã base64
        const mimeType = dataURL.split(",")[0].match(/:(.*?);/)[1]; // Lấy MIME type
        const byteArray = new Uint8Array(byteString.length);

        for (let i = 0; i < byteString.length; i++) {
            byteArray[i] = byteString.charCodeAt(i);
        }

        // Trả về Blob đại diện cho file ảnh
        return new Blob([byteArray], { type: mimeType });
    });

    // Thêm các ảnh vào FormData chỉ với Blob
    images.forEach((blob) => {
        formData.append("images[]", blob); // Không kèm tên file
    });

    // Hiển thị loading popup trong khi gửi ảnh
    loadingPopup.style.display = "flex";

    // Gửi toàn bộ ảnh đến API
    fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Something wrong!");
            }
            return response.json(); // Trả về JSON từ API
        })
        .then((results) => {
            // Đưa kết quả vào trang HTML khác
            loadingPopup.style.display = "none";
            console.log("Upload results:", results);
            convertResults = results
            displayPage2()
        })
        .catch((error) => {
            alert("Something wrong!");
            console.error(error);
            loadingPopup.style.display = "none";
        });
});

function displayPage2() {
    page1.style.display = "none";
    page2.style.display = "flex";
    totalPage = imageGrid.children.length;
    processEditableResults()
    loadPage(currentPage);   
}

function loadPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= totalPage) return;

    displayImage(pageIndex);
    renderHighlightedText(pageIndex);
    editText.value = editableResults[pageIndex]
    document.getElementById("pageNumber").innerText = `Page ${pageIndex + 1} / ${totalPage}`;
}

function displayImage(index) {
    // Lấy tất cả các phần tử con của imageGrid
    const imageItems = imageGrid.children;

    // Lấy phần tử tại chỉ số index
    const imageItem = imageItems[index];

    if (imageItem) {
        // Lấy ảnh (src) và tên ảnh (alt)
        const img = imageItem.querySelector("img");
        const name = imageItem.querySelector("p");

        if (img && name) {
            const imageSrc = img.src;  // Lấy URL ảnh
            const imageName = name.textContent;  // Lấy tên ảnh từ <p>

            // Hiển thị ảnh và tên ảnh ở một nơi khác (ví dụ: trong một div #image-display)
            imageDisplay.innerHTML = `
                <img src="${imageSrc}" alt="${imageName}" ondblclick="viewImage('${imageSrc}', '${imageName}')"/>
                <p>${imageName}</p>
            `;
        }
    } else {
        console.error("No image found at index " + index);
    }
}

function renderHighlightedText(index) {
    
    let text = '';

    convertResults[index].forEach(line => {
        let lineText = '';
        line.forEach(item => {
            if (item.confidence < 0.5) {
                lineText += `<span class="low-confidence">${item.word}</span> `;
            } else {
                lineText += `${item.word} `;
            }
        });
        text += `<p>${lineText.trim()}</p>`;
    });

    highlightedText.innerHTML = text;
}

function processEditableResults() {
    editableResults = [];

    convertResults.forEach((page, index) => {
        let editableText = '';

        page.forEach(line => {
            let lineText = '';
            line.forEach(item => {
                lineText += `${item.word} `;
            });
            editableText += lineText.trim() + '\n'; // Tạo dòng mới cho mỗi line
        });
        editableResults[index] = editableText.trim();
    });
    
}

function saveEditableResult(index) {
    editableResults[index] = editText.value.trim();
}

nextPage.addEventListener("click", function() {
    saveEditableResult(currentPage)
    if (currentPage < totalPage - 1) {
        currentPage++;
        loadPage(currentPage);
    }
});

prevPage.addEventListener("click", function() {
    saveEditableResult(currentPage)
    if (currentPage > 0) {
        currentPage--;
        loadPage(currentPage);
    }
});

function display1() {
    totalPage = 0
    convertResults = []
    currentPage = 0
    page2.style.display = "none";
    page1.style.display = "flex"
    imageGrid.innerHTML = "";
    convertButton.style.display = "none"
    window.location.reload();
}

downloadButton.addEventListener("click", downloadDoc);

function downloadDoc() {
    saveEditableResult(currentPage);
    loadingPopup.style.display = "flex";
    
    const doc = new docx.Document({
        sections: editableResults.map(content => ({
            properties: {},
            children: content.split("\n").map(line => (  // Chia nội dung theo dấu xuống dòng
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: line,
                            font: "Times New Roman",
                            size: 26,
                        })
                    ]
                })
            ))
        }))
    });

    // Tạo và tải xuống file Word
    docx.Packer.toBlob(doc).then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "result.docx"; // Tên file tải về
        link.click();
    });
    loadingPopup.style.display = "none";
}



