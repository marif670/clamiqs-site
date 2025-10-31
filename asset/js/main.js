// small helpers
document.getElementById && (document.getElementById('yr') && (document.getElementById('yr').textContent = new Date().getFullYear()));
document.getElementById && (document.getElementById('yr2') && (document.getElementById('yr2').textContent = new Date().getFullYear()));
// Tools modal functionality
function openTool(toolName) {
  const modal = document.getElementById("toolModal");
  const content = document.getElementById("toolContent");

  modal.style.display = "flex";

  // Placeholder demo content
  switch(toolName) {
    // === CalmBreath Animation ===
function startBreathingAnimation() {
  const circle = document.querySelector(".circle");
  const text = document.getElementById("breathText");

  let phase = 0; // 0 = Inhale, 1 = Hold, 2 = Exhale

  function cycle() {
    if (!circle || !text) return;

    if (phase === 0) {
      text.innerText = "Breathe In";
      circle.style.transform = "scale(1.3)";
      setTimeout(() => { phase = 1; cycle(); }, 4000);
    } 
    else if (phase === 1) {
      text.innerText = "Hold";
      setTimeout(() => { phase = 2; cycle(); }, 3000);
    } 
    else {
      text.innerText = "Breathe Out";
      circle.style.transform = "scale(1)";
      setTimeout(() => { phase = 0; cycle(); }, 5000);
    }
  }

  cycle();
}

  }
}

function closeTool() {
  document.getElementById("toolModal").style.display = "none";
}
