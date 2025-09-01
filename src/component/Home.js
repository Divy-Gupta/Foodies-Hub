import React from 'react'

const Home = () => {
  return (
    <>
    <section className='home' id='home'>
  <video autoPlay muted loop className="bg-video">
    <source src="/128126-740854563_tiny.mp4" type="video/mp4" />
  </video>
  <div className='content'>
    <h1><span>What to cook ?!</span></h1>
    <p>No need to wonder — just enter or upload ingredients and get instant recipes.</p>
    <div className="home-buttons">
      <button onClick={() => document.getElementById("search-btn").click()}>Search Recipes</button>
      <button onClick={() => document.getElementById("image-upload").click()}>Upload Image</button>
    </div>
  </div>
</section>

    </>
  )
}

export default Home
