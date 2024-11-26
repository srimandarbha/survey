import './ProfileCard.css'
function ProfileCard(props) {
    return (
    <div className="text-3xl font-bold underline">
      <h2>{props.name}</h2>
      <p>{props.about}</p>
    </div>
    );
}

export default ProfileCard