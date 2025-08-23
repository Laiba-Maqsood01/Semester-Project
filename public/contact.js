document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('feedbackName').value;
  const email = document.getElementById('feedbackEmail').value;
  const subject = document.getElementById('feedbackSubject').value;
  const message = document.getElementById('feedbackMessage').value;

  try {
    const res = await fetch('/submit-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, subject, message })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('feedbackSuccessMessage').textContent = 'Feedback submitted successfully!';
      e.target.reset();
    } else {
      alert(data.error || 'Submission failed');
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
});

//to load recent reviews
async function loadLatestReviews() {
  try {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = "";

    const res = await fetch('/api/latest-feedback');
    const feedbacks = await res.json();

    feedbacks.forEach(fb => {
      const div = document.createElement('div');
      div.className = 'review-card';
      div.innerHTML = `
      <h4>${fb.subject}</h4>
      <p><strong>${fb.name}</strong>(${new Date(fb.createdAt).toLocaleDateString()})</p>
      <p>${fb.message}</P> `;
      container.appendChild(div);
    });
    }
  catch (err) { 
    console.error("Error loading latest reviews: ", err);
  }
}

loadLatestReviews();