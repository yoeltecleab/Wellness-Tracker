const inputs = document.querySelectorAll(".input-field");
const toggle_btn = document.querySelectorAll(".toggle");
const main = document.querySelector("main");
const bullets = document.querySelectorAll(".bullets span");
const images = document.querySelectorAll(".image");
const openEye = document.querySelectorAll(".open");
const closeEye = document.querySelectorAll(".close");
const passwordField = document.querySelectorAll(".password");

inputs.forEach((inp) => {
    inp.addEventListener("focus", () => {
        inp.classList.add("active");
    });
    inp.addEventListener("blur", () => {
        if (inp.value !== "") return;
        inp.classList.remove("active");
    });
});

toggle_btn.forEach((btn) => {
    btn.addEventListener("click", switchMode);
});

function moveSlider() {
    let index = this.dataset.value;

    let currentImage = document.querySelector(`.img-${index}`);
    images.forEach((img) => img.classList.remove("show"));
    currentImage.classList.add("show");

    const textSlider = document.querySelector(".text-group");
    textSlider.style.transform = `translateY(${-(index - 1) * 2.2}rem)`;

    bullets.forEach((bull) => bull.classList.remove("active"));
    this.classList.add("active");
}

bullets.forEach((bullet) => {
    bullet.addEventListener("click", moveSlider);
});

function switchMode() {
    main.classList.toggle("sign-up-mode");
}

openEye.forEach(btn =>

btn.addEventListener("click", () => {
    passwordField.forEach(
        (inp) => (inp.type = "password")
    );
    openEye.forEach(op => op.style.display = "none");
    closeEye.forEach(cl => cl.style.display = "block");
})
)

closeEye.forEach(btn =>
    btn.addEventListener("click", () => {
        passwordField.forEach(
            (inp) => (inp.type = "text")
        );
        closeEye.forEach(cl => cl.style.display = "none");
        openEye.forEach(op => op.style.display = "block");
    })
)

